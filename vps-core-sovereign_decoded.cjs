const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- ENVIRONMENT LOADER ---
const envPath = '.env';
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const logDir = path.join(__dirname, 'nova-data');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, 'sovereign.log');

function log(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    try { fs.appendFileSync(logFile, entry + '\n'); } catch (e) { }
}

// --- HTTPS SERVER OPS ---
const options = {
    cert: fs.readFileSync('/home/aims/nova/certs/fullchain.pem'),
    key: fs.readFileSync('/home/aims/nova/certs/privkey.pem')
};

async function executeLLM(jobPayload) {
    const model = 'gpt-4o-mini';
    const rawPayload = jobPayload.payload || jobPayload;
    const finalPayload = rawPayload.payload || rawPayload;

    let messages = [];
    if (finalPayload?.contents) {
        messages = finalPayload.contents.map(c => ({
            role: c.role === 'user' ? 'user' : (c.role === 'system' ? 'system' : 'assistant'),
            content: (Array.isArray(c.parts) ? c.parts.map(p => p.text).join('') : (c.text || ''))
        })).filter(m => m.content);
    } else if (finalPayload?.messages) {
        messages = finalPayload.messages;
    } else if (finalPayload?.prompt) {
        messages = [{ role: 'user', content: finalPayload.prompt }];
    }

    if (messages.length === 0) messages = [{ role: 'user', content: "Hi Nova." }];

    if (!messages.some(m => m.role === 'system')) {
        messages.unshift({ role: 'system', content: "You are Nova, Ray's Sovereign AI assistant. Reply warmly and efficiently." });
    }

    const body = JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7 });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
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
                    else resolve(parsed);
                } catch (e) { reject(new Error('Parse fail')); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// --- BRIDGE SERVER ---
const server = https.createServer(options, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ACTIVE', version: '2.6.10-Bridge', relay: 'active' }));
        return;
    }

    if (url.pathname === '/api/search' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const result = await executeLLM({ prompt: `Search search context for: ${data.query}` });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, results: [{ Content: result.choices[0].message.content }] }));
            } catch (e) {
                res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    res.writeHead(404); res.end();
});

// --- POLLERS ---
let isPolling = false;
async function pollJobs() {
    if (isPolling) return;
    isPolling = true;
    try {
        const { data: jobs, error } = await supabase.from('relay_jobs').select('*').eq('status', 'pending').limit(1);
        if (error || !jobs || jobs.length === 0) return;
        const job = jobs[0];
        log(`[Relay] Processing ${job.id}`);
        await supabase.from('relay_jobs').update({ status: 'processing' }).eq('id', job.id);
        try {
            const result = await executeLLM(job);
            await supabase.from('relay_jobs').update({ status: 'completed', result }).eq('id', job.id);
            log(`[Relay] Done ${job.id}`);
        } catch (e) {
            await supabase.from('relay_jobs').update({ status: 'failed', error: e.message }).eq('id', job.id);
        }
    } catch (e) { } finally { isPolling = false; }
}

async function pollComms() {
    try {
        const { data: messages, error } = await supabase.from('agent_architect_comms').select('*').eq('status', 'unread');
        if (error || !messages || messages.length === 0) return;
        for (const msg of messages) {
            if (msg.metadata?.recipient?.toLowerCase() === 'nova') {
                log(`[Clerk] Handling ping: ${msg.message}`);
                await supabase.from('agent_architect_comms').update({ status: 'processing' }).eq('id', msg.id);
                try {
                    const result = await executeLLM({ prompt: msg.message });
                    await supabase.from('agent_architect_comms').insert({
                        sender: 'nova', message: result.choices[0].message.content, status: 'unread',
                        metadata: { recipient: 'user', reply_to: msg.id }
                    });
                    await supabase.from('agent_architect_comms').update({ status: 'read' }).eq('id', msg.id);
                } catch (e) {
                    await supabase.from('agent_architect_comms').update({ status: 'failed' }).eq('id', msg.id);
                }
            }
        }
    } catch (e) { }
}

// HEARTBEAT REMOVED TO PREVENT ROBOTIC ECHOES

server.listen(3505, '0.0.0.0', () => {
    log('🚀 [Sovereign Hub] HTTPS Bridge active on port 3505');
    setInterval(pollJobs, 1000);
    setInterval(pollComms, 15000);
});
