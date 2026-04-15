require('dotenv').config({ path: '/home/aims/vanguard-agents/MySimpleAIHelp/.env' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = (process.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const openaiKey = (process.env.VITE_OPENAI_API_KEY || "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function getEmbedding(text) {
    const body = JSON.stringify({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000)
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/embeddings',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            }
        }, r => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed.data[0].embedding);
                } catch (e) { reject(new Error('Parse fail: ' + data.substring(0, 100))); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function ingest() {
    console.log("🚀 Starting Memory Ingestion...");

    // Get messages that aren't memorized yet
    const { data: messages, error } = await supabase
        .from('nova_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Debug batch

    if (error) {
        console.error("❌ Error fetching messages:", error.message);
        return;
    }

    console.log(`📡 Processing ${messages.length} messages...`);

    for (const msg of messages) {
        try {
            console.log(`🧠 Memorizing: ${msg.id}`);
            const embedding = await getEmbedding(msg.content);

            const { error: memError } = await supabase
                .from('nova_memories')
                .insert({
                    content: msg.content,
                    category: msg.role === 'user' ? 'user_instruction' : 'nova_response',
                    metadata: { original_msg_id: msg.id, role: msg.role },
                    embedding: embedding
                });

            if (memError) {
                console.error(`❌ Memory Error for ${msg.id}:`, JSON.stringify(memError, null, 2));
            } else {
                console.log(`✅ Success: ${msg.id}`);
            }
        } catch (e) {
            console.error(`❌ Global Error for ${msg.id}:`, e.message);
            if (e.stack) console.error(e.stack);
            console.error("Full error detail:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }
    }

    console.log("🏁 Ingestion Complete.");
}

ingest();
