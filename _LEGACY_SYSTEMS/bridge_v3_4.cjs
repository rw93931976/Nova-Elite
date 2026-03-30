const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
require('dotenv').config();

const PORT = 3510;
const TUNNEL_PORT = 3511; 
const SCRATCH_DIR = path.resolve(__dirname, 'nova-data');
const GEMINI_KEY = "AIzaSyBKdROGcbrA6UCt4QZ_uy5xOrqmYQGMJjM";

if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

function logToFile(msg) {
    try {
        const timestamp = new Date().toLocaleString();
        const logPath = path.join(SCRATCH_DIR, 'nova_bridge.log');
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {}
    console.log(`[Bridge] ${msg}`);
}

async function proxyLLM(provider, body) {
    return new Promise((resolve, reject) => {
        const providers = {
            openai: { hostname: 'api.openai.com', path: '/v1/chat/completions', auth: `Bearer ${process.env.VITE_OPENAI_API_KEY}` },
            gemini: { hostname: 'generativelanguage.googleapis.com', path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, auth: '' }
        };
        const config = providers[provider] || providers.openai;
        const isGemini = provider === 'gemini';
        
        let postData;
        if (isGemini) {
            postData = JSON.stringify({ contents: [{ parts: [{ text: body.messages[body.messages.length - 1].content }] }] });
        } else {
            postData = JSON.stringify(body);
        }

        const options = {
            hostname: config.hostname,
            path: config.path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        if (config.auth) options.headers['Authorization'] = config.auth;

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { 
                try { 
                    const parsed = JSON.parse(data);
                    if (isGemini) {
                        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        resolve({ status: res.statusCode, data: { choices: [{ message: { content } }] } });
                    } else {
                        resolve({ status: res.statusCode, data: parsed }); 
                    }
                } catch (e) { resolve({ status: res.statusCode, raw: data }); } 
            });
        });
        req.on('error', e => reject(e)); req.write(postData); req.end();
    });
}

async function executeWebSearch(query) {
    return new Promise((resolve) => {
        logToFile(`Web Search called: ${query}`);
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        https.get(ddgUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                let info = '';
                try {
                    if (data.trim()) {
                        const ddg = JSON.parse(data);
                        info = ddg.AbstractText || ddg.Answer || '';
                        if (!info && ddg.RelatedTopics && ddg.RelatedTopics.length > 0) {
                            info = ddg.RelatedTopics[0].Text;
                        }
                    }
                } catch (e) { }

                const prompt = `You are Nova, an AI assistant. Use the following real-time data to answer the user's query briefly and naturally.\nToday's Date: ${new Date().toDateString()}\nQuery: "${query}"\nSearch Data: "${info || 'No direct results found, but try to answer from general knowledge if appropriate.'}"`;

                let finalResult;
                try {
                    const aiRes = await proxyLLM('gemini', {
                        messages: [{ role: 'system', content: prompt }]
                    });
                    finalResult = aiRes.data?.choices?.[0]?.message?.content;
                } catch (e) { logToFile(`LLM Error: ${e.message}`); }

                if (!finalResult) finalResult = info || `I searched for "${query}" but couldn't get a specific update. It's likely seasonal or standard for this time.`;

                resolve({
                    success: true,
                    count: 1,
                    results: [{ Name: 'Web Summary', Content: finalResult }],
                    query,
                    type: 'internet'
                });
            });
        }).on('error', (e) => {
            logToFile(`Search error: ${e.message}`);
            resolve({ success: false, error: 'Internet connectivity issue' });
        });
    });
}

async function relayDiscovery(body) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(body);
        const options = {
            hostname: '127.0.0.1',
            port: TUNNEL_PORT,
            path: '/deep-discovery',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ success: false, error: 'Relay parse error' }); } });
        });
        req.on('error', (e) => resolve({ success: false, error: 'Desktop bridge offline' }));
        req.write(postData); req.end();
        setTimeout(() => { req.destroy(); resolve({ success: false, error: 'Relay timeout' }); }, 15000);
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ACTIVE', version: '3.4' }));
        return;
    }

    if (url.pathname === '/deep-discovery' && req.method === 'POST') {
        let bodyText = '';
        req.on('data', c => bodyText += c);
        req.on('end', async () => {
            try {
                if (!bodyText) {
                     res.writeHead(400); res.end("Empty body"); return;
                }
                const body = JSON.parse(bodyText);
                const q = (body.query || '').toLowerCase();
                const keywords = ['weather', 'news', 'search', 'internet', 'online', 'price', 'nashville', 'houston', 'dallas', 'tonight', 'time'];
                
                if (keywords.some(k => q.includes(k))) {
                    const result = await executeWebSearch(body.query);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } else {
                    const result = await relayDiscovery(body);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }
            } catch (e) {
                logToFile("Server Error: " + e.message);
                res.writeHead(500); res.end(JSON.stringify({ success: false, error: "Internal Bridge Error" }));
            }
        });
        return;
    }
    res.writeHead(404); res.end();
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Bridge v3.4 (Pure) active on ${PORT}`));
