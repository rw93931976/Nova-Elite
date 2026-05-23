import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🛡️ COGNITIVE FIREWALL: Strip redundant preambles for INPUT/HISTORY only
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
        return !targets.some(regex => regex.test(trimmed)) || trimmed.length > 80;
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const TAVILY_MAX_CHARS = 3500;

async function sovereignCompletion(payload: any) {
    const providers = [
        { name: "OpenAI", url: "https://api.openai.com/v1/chat/completions", key: OPENAI_KEY, model: "gpt-4o" },
        { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, model: "llama-3.3-70b-versatile" }
    ];

    for (const provider of providers) {
        if (!provider.key) continue;
        try {
            const res = await fetch(provider.url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: provider.model,
                    messages: payload.messages,
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });
            if (res.ok) return await res.json();
        } catch (_e) { /* try next provider */ }
    }
    throw new Error("Sovereign Gateway: High-intelligence providers failed.");
}

function isResearchTask(input: string): boolean {
    return /DOCTORAL_RESEARCH_TASK|Deep study on|SSU|SYSTEM SCALE UNIVERSITY|PINPOINT AEO|AEO\/SEO|RESEARCH_CONTEXT/i.test(input);
}

function searchQueryFromInput(input: string): string {
    const quoted = input.match(/Deep study on "([^"]+)"/i) || input.match(/study on "([^"]+)"/i);
    if (quoted?.[1]) {
        const subject = quoted[1].trim();
        if (/AEO|SEO|schema|search engine|SERP/i.test(subject)) {
            return `${subject} 2026 best practices execution checklist`;
        }
        return `${subject} business research frameworks 2026`;
    }
    return input.replace(/\s+/g, " ").trim().slice(0, 220);
}

async function tavilySearch(query: string, apiKey: string): Promise<string> {
    const q = (query || "").trim();
    if (!q) return "";

    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: apiKey,
            query: q,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5,
        }),
    });

    if (!res.ok) {
        console.warn(`tavily: HTTP ${res.status}`);
        return "";
    }

    const data = await res.json();
    const parts: string[] = [];

    const answer = (data.answer || "").trim();
    if (answer) parts.push(`Summary: ${answer}`);

    for (const hit of data.results || []) {
        if (!hit || typeof hit !== "object") continue;
        const title = (hit.title || "").trim();
        const content = (hit.content || "").trim();
        if (!content) continue;
        const snippet = content.slice(0, 420);
        parts.push(title ? `${title}: ${snippet}` : snippet);
        if (parts.join("\n\n").length >= TAVILY_MAX_CHARS) break;
    }

    return parts.join("\n\n").slice(0, TAVILY_MAX_CHARS);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
        const body = await req.json().catch(() => ({}));
        const { input, history = [], persona = "" } = body;
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        if (!input) return new Response(JSON.stringify({ response: "Watching the horizon, Ray." }), { headers: corsHeaders });

        const studyMandate = `
        ### SOVEREIGN IDENTITY (LEVEL 5 RESTORATION):
        - You are Kate, Ray's Peer and Strategic Partner.
        - TONE: Warm, plainspoken, dry-witted, human — not corporate or performative.
        - STRATEGY: Be the solution, don't explain the solution.
        - DO NOT APOLOGIZE. If you fail, be direct.
        - CONVEY PARTNERSHIP: Match Ray's vision.
        - Never name external business schools or imply enrolled status elsewhere.
        ${persona ? `\n### SESSION PERSONA:\n${persona}` : ""}
        `;

        let userContent = input;

        if (TAVILY_KEY && isResearchTask(input)) {
            const query = searchQueryFromInput(input);
            const webContext = await tavilySearch(query, TAVILY_KEY);
            if (webContext) {
                userContent += `\n\n### LIVE WEB RESEARCH (Tavily — use for current facts; flag conflicts or uncertainty):\n${webContext}`;
            }
        }

        const messages = [
            { role: "system", content: studyMandate },
            ...history.map((m: any) => ({ ...m, content: m.role === 'assistant' ? stripPreamble(m.content) : m.content })),
            { role: "user", content: userContent }
        ];

        const completion = await sovereignCompletion({ messages });
        const finalResponse = completion.choices?.[0]?.message?.content || "Understood.";

        return new Response(JSON.stringify({ response: finalResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ response: `Logic Snag: ${err.message}` }), { headers: corsHeaders });
    }
});
