import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabaseUrl = "https://nqrtqfgbnwzsveemuyuu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const openAiKey = process.env.VITE_OPENAI_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("🧠 Starting Sovereign Memory Pulse...");

    // 1. Get last 50 messages
    const { data: messages, error: msgErr } = await supabase
        .from('nova_messages')
        .select('content, role, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (msgErr || !messages) return console.error(msgErr);

    console.log(`🔍 Ingesting ${messages.length} messages into Vector Store...`);

    for (const msg of messages) {
        try {
            // 2. Embed
            const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "text-embedding-3-small", input: msg.content })
            });
            const embedData = await embedRes.json();
            const embedding = embedData.data?.[0]?.embedding;

            if (embedding) {
                // 3. Save to nova_memories
                await supabase.from('nova_memories').insert({
                    content: msg.content,
                    category: 'historical_seed',
                    embedding: embedding,
                    metadata: { original_timestamp: msg.created_at, role: msg.role }
                });
                process.stdout.write(".");
            }
        } catch (e) {
            console.error("\n❌ Skip error:", e.message);
        }
    }
    console.log("\n✅ Sovereign Memory Pulse Complete.");
}

seed();
