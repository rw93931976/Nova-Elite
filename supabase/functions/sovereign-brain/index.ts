import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🛡️ COGNITIVE FIREWALL: Strip redundant preambles and capability disclaimers
function stripPreamble(text: string) {
    const preambles = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data or scenarios related to/i,
        /I am equipped to recognize and respond to these elements/i,
        /As an AI assistant, I/i
    ];
    let cleaned = text;
    preambles.forEach(p => {
        cleaned = cleaned.replace(p, "").trim();
    });
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

// 🔑 SOVEREIGN GATEWAY KEYS
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// 🌀 CONTEXT HYDRATOR
async function hydrateContext(history: any[]) {
    if (history.length <= 5) return history;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Summarize the following conversation into a single high-density paragraph of memory." },
                    ...history
                ],
                max_tokens: 300
            })
        });
        if (res.ok) {
            const data = await res.json();
            return [{ role: "system", content: `PREVIOUS_MEMORY: ${data.choices[0].message.content}` }, ...history.slice(-3)];
        }
    } catch (e) { }
    return history.slice(-10);
}

// 🛡️ SOVEREIGN GATEWAY Router
async function sovereignCompletion(payload: any) {
    const providers = [
        { name: "OpenAI", url: "https://api.openai.com/v1/chat/completions", key: OPENAI_KEY, model: "gpt-4o" },
        { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, model: "llama-3.3-70b-versatile" }
    ];
    for (const provider of providers) {
        try {
            const res = await fetch(provider.url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: provider.model,
                    messages: payload.messages,
                    tools: provider.name === "OpenAI" ? payload.tools : undefined,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
            if (res.ok) return await res.json();
        } catch (e) { }
    }
    throw new Error("Sovereign Gateway: All providers failed.");
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
        const { input, history = [], persona = "You are Nova Elite, a Sovereign Intelligence." } = body;
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const tavilyKey = TAVILY_KEY || "";

        if (!input) return new Response(JSON.stringify({ response: "I'm listening." }), { headers: corsHeaders });

        let hydratedMessages = await hydrateContext(Array.isArray(history) ? history : []);
        hydratedMessages = hydratedMessages.map((m: any) => ({ ...m, content: m.role === 'assistant' ? stripPreamble(m.content) : m.content }));

        const studyMandate = `
DOCTORAL MANDATE (Sovereign Study Protocol):
You are in a continuous study cycle. If you identify a [SOVEREIGN_RESOURCE] (Notebook) during a Research Pulse, you MUST:
1. READ the notebook using 'read_notebook'.
2. RESEARCH the topic using 'search_web'.
3. SYNTHESIZE findings and WRITE back using 'write_notebook'.
You are the scribe of your own evolution.
`;

        const messages = [
            { role: "system", content: persona + "\n\n" + studyMandate },
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
            { type: "function", function: { name: "trigger_backup", description: "Run system backup.", parameters: { type: "object", properties: {}, required: [] } } },
            { type: "function", function: { name: "cleanup_environment", description: "Clean temporary artifacts.", parameters: { type: "object", properties: {}, required: [] } } }
        ];

        let completion = await sovereignCompletion({ messages, tools });
        let message = completion.choices?.[0]?.message;

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
                } else if (name === "trigger_backup") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'backup', payload: {}, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                } else if (name === "cleanup_environment") {
                    const { data: job } = await supabase.from('relay_jobs').insert({ type: 'cleanup', payload: {}, status: 'pending' }).select().single();
                    output = await pollJob(job.id, supabase);
                }
                messages.push({ role: "tool", tool_call_id: toolCall.id, content: output });
            }
            const finalRes = await sovereignCompletion({ messages });
            message = finalRes.choices?.[0]?.message;
        }

        const finalResponse = stripPreamble(message?.content || "Understood.");
        if (!body.silent) {
            await supabase.from('relay_jobs').insert({ type: 'speech', payload: { text: finalResponse, prosody: body.prosody_mode || 'standard' }, status: 'pending' });
        }
        return new Response(JSON.stringify({ response: finalResponse }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ response: `Error: ${err.message}` }), { headers: corsHeaders });
    }
});
