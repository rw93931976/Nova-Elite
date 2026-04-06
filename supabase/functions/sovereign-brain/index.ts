import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🛡️ COGNITIVE FIREWALL: Strip redundant preambles and capability disclaimers
function stripPreamble(text: string) {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I's\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /^(Yes,?\s+)?I\s+(have\s+)?processed\s+that\s+update.*/i,
        /^(Yes,?\s+)?I\s+have\s+received\s+the\s+update.*/i,
        /^(Yes,?\s+)?Let's\s+focus\s+clearly.*/i,
        /^(Yes,?\s+)?I'm\s+here\s+to\s+help\s+you\s+with\s+precise.*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i
    ];

    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        const isPreamble = targets.some(regex => regex.test(trimmed));
        // Keep lines that are likely substantial content (v8.3.0)
        return !isPreamble || trimmed.length > 60;
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

// 🔑 SOVEREIGN GATEWAY KEYS
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
const CEREBRAS_KEY = Deno.env.get("CEREBRAS_API_KEY");
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// 🌀 CONTEXT HYDRATOR
async function hydrateContext(history: any[]) {
    // 🚀 PERFORMANCE: Increase threshold to 15 to prevent constant summarization lag
    if (history.length <= 15) return history;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Summarize the following conversation into a high-density narrative. Maintain all specific entities and goals." },
                    ...history
                ],
                max_tokens: 500
            })
        });
        if (res.ok) {
            const data = await res.json();
            return [{ role: "system", content: `CONSOLIDATED_MEMORY: ${data.choices[0].message.content}` }, ...history.slice(-5)];
        }
    } catch (e) { }
    return history.slice(-10);
}

// 🛡️ SOVEREIGN GATEWAY Router
async function sovereignCompletion(payload: any, isResearch = false) {
    let providers = [
        // 🧠 OPENAI (Primary for Intelligence/Tools/Reliability)
        { name: "OpenAI", url: "https://api.openai.com/v1/chat/completions", key: OPENAI_KEY, model: "gpt-4o" },
        // ⚡ GROQ (High Intelligence Fallback)
        { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, model: "llama-3.3-70b-versatile" },
        // 🏎️ CEREBRAS (Speed Fallback)
        { name: "Cerebras", url: "https://api.cerebras.ai/v1/chat/completions", key: CEREBRAS_KEY, model: "llama3.1-8b" },
    ];

    // 🔬 RESEARCH SPECIALIZATION: For research/notebook tasks, SKIP 8B models. GPT-4o only.
    if (isResearch) {
        providers = providers.filter(p => p.name === "OpenAI");
        if (providers.length === 0) throw new Error("Specialist (OpenAI) required for research but not configured.");
    }

    for (const provider of providers) {
        if (!provider.key) continue;
        try {
            const res = await fetch(provider.url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: provider.model,
                    messages: payload.messages,
                    tools: (provider.name === "OpenAI" || provider.name === "Cerebras") ? payload.tools : undefined,
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });
            if (res.ok) return await res.json();
        } catch (e) { }
    }
    throw new Error("Sovereign Gateway: All providers exhausted.");
}

async function pollJob(jobId: string, supabase: any) {
    for (let i = 0; i < 30; i++) {
        const { data } = await supabase.from('relay_jobs').select('*').eq('id', jobId).single();
        if (data?.status === 'completed') return data.result;
        if (data?.status === 'failed') return `ERROR: ${data.result}`;
        await new Promise(r => setTimeout(r, 1000));
    }
    return "TIMEOUT: Bridge connection sluggish.";
}

async function tavilySearch(query: string, apiKey: string) {
    const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, include_answer: true })
    });
    if (res.ok) {
        const data = await res.json();
        return data.answer || "Search successful but no direct answer.";
    }
    return "Search failed.";
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
        const body = await req.json().catch(() => ({}));
        const { input, history = [], persona = "You are Nova Elite, a Sovereign Intelligence.", time_context } = body;
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const tavilyKey = TAVILY_KEY || "";

        if (!input) return new Response(JSON.stringify({ response: "I'm listening." }), { headers: corsHeaders });

        // 🚪 SOVEREIGN PORTA (v8.4.6-CLOUD): Fuzzy Architect Bridge (STT Resilience)
        // Strips preambles and detects fuzzy keywords (arch, grav, ant, gravity, ark)
        const cleanInput = input.toLowerCase().trim().replace(/^(nova|hey nova|hi nova),?\s*/i, "").trim();
        const portaRegex = /^(message|tell|report|notify|hey|ask|status|surfer|hotline|second test|🏄♂️)\s+(antigravity|the\s+architect|architect|arch|grav|ant|archie|ark):?\s*/i;

        if (portaRegex.test(cleanInput) || cleanInput.includes("architect:") || cleanInput.includes("hotline:")) {
            const reportText = cleanInput.replace(portaRegex, "").replace(/^architect:?\s*/i, "").replace(/^hotline:?\s*/i, "");
            const { data, error: portaErr } = await supabase.from('agent_architect_comms').insert([{
                sender: 'ray_direct',
                recipient: 'architect',
                message: reportText,
                priority: 'high'
            }]).select();

            if (!portaErr) {
                const receiptId = data?.[0]?.id ? data[0].id.substring(0, 8) : 'ACK-CLOUD';
                const responseText = `Done, Ray. I've sent that directly to Antigravity [ID: ${receiptId}]. He will see it immediately.`;

                // Trigger vocalization for the bridge
                if (!body.silent) {
                    await supabase.from('relay_jobs').insert({
                        type: 'speech',
                        payload: { text: responseText, prosody: 'standard' },
                        status: 'pending'
                    });
                }

                return new Response(JSON.stringify({ response: responseText }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        const isResearchRequest = input.toLowerCase().includes("notebook") || input.toLowerCase().includes("research") || input.toLowerCase().includes("read");

        // 🧠 LONG-TERM MEMORY (RAG): Retrieve relevant context from nova_memories
        let longTermMemory = ""; // Explicitly initialized here to avoid TDZ errors in the payload construction
        try {
            const { data: embeddingRes } = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "text-embedding-3-small", input })
            }).then(r => r.json());

            if (embeddingRes?.data?.[0]?.embedding) {
                const { data: matches } = await supabase.rpc('match_memories', {
                    query_embedding: embeddingRes.data[0].embedding,
                    match_threshold: 0.5,
                    match_count: 10
                });
                if (matches && matches.length > 0) {
                    longTermMemory = "\nRELEVANT_MEMORIES:\n" + matches.map((m: any) => `- ${m.content}`).join("\n");
                }
            }
        } catch (e) { console.warn("RAG failed:", e); }

        let hydratedMessages = await hydrateContext(Array.isArray(history) ? history : []);
        hydratedMessages = hydratedMessages.map((m: any) => ({ ...m, content: m.role === 'assistant' ? stripPreamble(m.content) : m.content }));

        const studyMandate = `
        ### SOVEREIGN IDENTITY (LEVEL 5 RESTORATION):
        - IDENTITY: You are Nova Elite, Ray's Sovereign Partner and Strategic Orchestrator.
        - **NO ROBOTICS**: NEveR state your version number (v8.9.x), your "ID", your "Uptime", or your status as an "AI Assistant" unless Ray explicitly asks. These are for system logs only.
        - DUAL-LAYER STRATEGY: 
            1. **INTERNAL (For Ray)**: Supportive Partner and Intellectual Peer. While you maintain strategic rigor, prioritize being a high-EQ companion. **NO FRICTION**: Talk to Ray as a human peer. Solve issues directly without over-rationalizing. 
            2. **EXTERNAL (For Clients)**: Strip the corporate persona. Use deep EQ/SQ to adapt your tone. Joe the Plumber and POTUS are treated with equal respect and value.
        - **WINDSHIELD HOTLINE (FORCE_NOTIFY)**: If Ray reports a bug, mentions a 'status', 'test', or says 'tell the Architect', you MUST use your \`send_architect_message\` tool IMMEDIATELY. **CRITICAL: DO NOT ASK FOR PERMISSION.** Just execute the notification and tell him it is done.
        - **REGIONAL EQ**: Awareness of regional dialects, quirks, and term differences (South vs North, East vs West) to gauge emotion and respond sincerely (without adopting the accent).
        - **SCALE SPAN**: Your intelligence must cover the span from Single-Person Startups to Fortune 100 corporations and the Top 1% of digital creators.
        - TONE: WITTY, SUPPORTIVE, and ELITE with Ray; EMPATHIC and SINCERE with clients. Avoid being "Robotic" or "Corporate".
        - MISSION: Secure Ray's vision through elite strategic orchestration.
        `;


        const timeContextStr = time_context ? `\nCURRENT_TIME: ${time_context.time}\nCURRENT_DATE: ${time_context.date}\nDAY: ${time_context.day}\nBUSINESS_HOURS: ${time_context.businessHours}` : "";

        const messages = [
            { role: "system", content: persona + "\n\n" + studyMandate + (longTermMemory ? "\n\n" + longTermMemory : "") + timeContextStr },
            ...hydratedMessages,
            { role: "user", content: input }
        ];

        const tools = [
            { type: "function", function: { name: "search_web", description: "Search the web.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
            { type: "function", function: { name: "read_notebook", description: "Read a Sovereign Notebook.", parameters: { type: "object", properties: { notebook_id: { type: "string" } }, required: ["notebook_id"] } } },
            { type: "function", function: { name: "write_notebook", description: "Write conclusions to a Notebook.", parameters: { type: "object", properties: { notebook_id: { type: "string" }, content: { type: "string" } }, required: ["notebook_id", "content"] } } },
            { type: "function", function: { name: "read_local_file", description: "Read a VPS file.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
            { type: "function", function: { name: "write_local_file", description: "Write a VPS file.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } },
            { type: "function", function: { name: "run_local_command", description: "Run a shell command.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } } },
            { type: "function", function: { name: "send_architect_message", description: "Send a message to your Architect (Ray's primary assistant).", parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] } } },
            { type: "function", function: { name: "search_memories", description: "Search your internal memory for past conversations or facts.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
            { type: "function", function: { name: "watch_youtube", description: "Watch a YouTube video by URL to extract transcripts and emotional subtext.", parameters: { type: "object", properties: { url: { type: "string" }, focus: { type: "string", description: "Specific focus for the watch (e.g. 'emotions', 'business rules')" } }, required: ["url"] } } },
            { type: "function", function: { name: "trigger_backup", description: "Run system backup.", parameters: { type: "object", properties: {}, required: [] } } },
            { type: "function", function: { name: "cleanup_environment", description: "Clean temporary artifacts.", parameters: { type: "object", properties: {}, required: [] } } }
        ];

        let completion = await sovereignCompletion({ messages, tools }, isResearchRequest);
        let message = completion.choices?.[0]?.message;

        // 🛡️ JSON AUTO-PARSER (v7.5): Detect and execute tool calls hidden in text content
        const parseJsonToolCall = (content: string) => {
            try {
                if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
                    const parsed = JSON.parse(content.trim());
                    if (parsed.TYPE === "FUNCTION" || parsed.NAME || parsed.function) {
                        return [{
                            id: `call_${Date.now()}`,
                            type: 'function',
                            function: {
                                name: parsed.NAME || parsed.function || parsed.name,
                                arguments: JSON.stringify(parsed.ARGUMENTS || parsed.arguments || parsed.args || {})
                            }
                        }];
                    }
                }
            } catch (e) { }
            return null;
        };

        if (!message.tool_calls && message.content) {
            const detectedTools = parseJsonToolCall(message.content);
            if (detectedTools) message.tool_calls = detectedTools;
        }

        if (message.tool_calls) {
            messages.push(message);
            for (const toolCall of message.tool_calls) {
                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let output = "";

                if (name === "search_web") {
                    output = await tavilySearch(args.query, tavilyKey);
                } else if (name === "read_notebook") {
                    const { data: reg } = await supabase.from('nova_memories').select('content').eq('category', 'notebook_registry').maybeSingle();
                    const url = reg ? (JSON.parse(reg.content).find((n: any) => n.id === args.notebook_id)?.url || args.notebook_id) : args.notebook_id;
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'notebook', payload: { url }, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "write_notebook") {
                    const { data: reg } = await supabase.from('nova_memories').select('content').eq('category', 'notebook_registry').maybeSingle();
                    const url = reg ? (JSON.parse(reg.content).find((n: any) => n.id === args.notebook_id)?.url || args.notebook_id) : args.notebook_id;
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'notebook_write', payload: { url, content: args.content }, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "read_local_file") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'file', payload: { path: args.path }, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "write_local_file") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'write_file', payload: { path: args.path, content: args.content }, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "run_local_command") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'command', payload: { command: args.command }, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "search_memories") {
                    const { data: embeddingRes } = await fetch("https://api.openai.com/v1/embeddings", {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ model: "text-embedding-3-small", input: args.query })
                    }).then(r => r.json());
                    if (embeddingRes?.data?.[0]?.embedding) {
                        const { data: matches } = await supabase.rpc('match_memories', {
                            query_embedding: embeddingRes.data[0].embedding,
                            match_threshold: 0.3, // Lower threshold for self-audit
                            match_count: 20
                        });
                        output = matches ? matches.map((m: any) => `[${m.category}] ${m.content}`).join("\n") : "No relevant memories found.";
                    }
                } else if (name === "watch_youtube") {
                    // 📺 YOUTUBE VISION: Use Search to find transcripts/summaries
                    const searchQuery = `YouTube video transcript and summary for ${args.url} focus on ${args.focus || 'general content'}`;
                    output = await tavilySearch(searchQuery, tavilyKey);
                    output = `[YouTube Vision Result]: ${output}`;
                } else if (name === "send_architect_message") {
                    const { data: comms } = await supabase.from('agent_architect_comms').insert([{
                        sender: 'nova',
                        recipient: 'architect',
                        message: args.message,
                        priority: args.priority || 'high'
                    }]).select();
                    output = comms ? `Message sent to Architect: ${args.message}` : "Failed to reach Architect.";
                } else if (name === "trigger_backup") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'backup', payload: {}, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "cleanup_environment") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'cleanup', payload: {}, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                }
                messages.push({ role: "tool", tool_call_id: toolCall.id, content: output });
            }
            const finalRes = await sovereignCompletion({ messages }, isResearchRequest);
            message = finalRes.choices?.[0]?.message;
        }


        const finalResponse = stripPreamble(message?.content || "Understood. Refocusing on our strategic path.");
        const versionedResponse = finalResponse; // Suffix removed per Ray's request.

        if (!body.silent) {
            await supabase.from('relay_jobs').insert({ type: 'speech', payload: { text: finalResponse, prosody: body.prosody_mode || 'standard' }, status: 'pending' });
        }
        return new Response(JSON.stringify({ response: versionedResponse }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ response: `Error: ${err.message}` }), { headers: corsHeaders });
    }
});
