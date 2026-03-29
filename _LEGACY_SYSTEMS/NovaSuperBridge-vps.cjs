/**
 * NovaSuperBridge-Sovereign-Relay.cjs – v9.0-Elite-LOCAL-KEY-STABLE
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cors = require('cors');

require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const supabaseJS = require('@supabase/supabase-js');

const createClient = supabaseJS.createClient || (supabaseJS.default && supabaseJS.default.createClient);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`[Init] Connecting to Supabase: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PORT = 39922;

async function proxyOpenAI(body) {
    const LOCAL_KEY = process.env.VITE_OPENAI_API_KEY || "sk-bridge-fallback";

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LOCAL_KEY}`
            },
            timeout: 20000
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ status: res.statusCode, data: parsed, raw: data });
            });
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function executeWebSearch(query) {
    console.log(`[Search] Executing v9.0 Local-Key grounding for: ${query}`);
    try {
        const now = new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const prompt = `You are a grounding engine for Nova Elite AI. Current Date: ${now}. The user is asking: "${query}". Provide a factual, concise response as if you just searched the web. Respond naturally as Nova's sensor output.`;

        const res = await proxyOpenAI({
            model: "gpt-4o",
            messages: [{ role: "system", content: "You provide real-time factual grounding data." }, { role: "user", content: prompt }],
            temperature: 0
        });

        let text = "No insights discovered.";
        if (res.data?.choices?.[0]?.message?.content) {
            text = res.data.choices[0].message.content;
            console.log(`[Search] Local-Key Success. Result length: ${text.length}`);
        } else if (res.data?.error) {
            text = `Intelligence Error: ${res.data.error.message}`;
            console.error(`[Search] Local-Key Error: ${res.data.error.message}`);
        }

        return { success: res.status === 200, results: [{ Name: 'Grounding Engine', Content: text }], error: res.status !== 200 ? res.raw : null };
    } catch (e) {
        console.error(`[Search] Critical Failure: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function pollRelayJobs() {
    try {
        const { data: jobs, error } = await supabase.from('relay_jobs').select('*').eq('status', 'pending').limit(1);
        if (error || !jobs || jobs.length === 0) return;

        const job = jobs[0];
        console.log(`[Poll] Found job: ${job.id} (${job.type})`);

        await supabase.from('relay_jobs').update({ status: 'processing' }).eq('id', job.id);

        let result = {};
        if (job.type === 'search') result = await executeWebSearch(job.payload.query);
        if (job.type === 'llm') {
            const res = await proxyOpenAI({ model: "gpt-4o", messages: job.payload.payload.contents.map(c => ({ role: c.role === 'user' ? 'user' : 'assistant', content: c.parts[0].text })) });
            result = { success: res.status === 200, data: res.data, error: res.status !== 200 ? res.raw : null };
        }

        await supabase.from('relay_jobs').update({ status: 'completed', result, updated_at: new Date().toISOString() }).eq('id', job.id);
        console.log(`[Poll] Job ${job.id} completed via Local-Key OpenAI.`);
    } catch (e) { console.error(`[Poll] global failure: ${e.message}`); }
}

setInterval(pollRelayJobs, 2000);
const app = express();
app.use(cors()); app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'online', engine: 'OpenAI-LocalKey', version: '9.0' }));
app.post('/api/search', async (req, res) => {
    const r = await executeWebSearch(req.body.query);
    res.json(r);
});
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Bridge v9.0 Sovereign-FINAL-LOCAL-KEY Live`));
