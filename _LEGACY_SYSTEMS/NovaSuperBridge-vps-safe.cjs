// NovaSuperBridge.cjs – v3.5.2 – Universal VPS Version (No Dependencies)
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser to avoid 'dotenv' dependency
async function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            });
        }
    } catch (e) {
        console.error('Error loading .env:', e.message);
    }
}
loadEnv();

const PORT = 3510;
const TUNNEL_PORT = 39922; // Local bridge reachable here on VPS
const SCRATCH_DIR = path.resolve(__dirname, 'nova-data');

if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

function logToFile(msg) {
    const timestamp = new Date().toLocaleString();
    const logPath = path.join(SCRATCH_DIR, 'nova_bridge.log');
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    console.log(`[Bridge] ${msg}`);
}

// --- INTERNET SEARCH LOGIC ---

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

                const prompt = `You are providing REAL-TIME internet data for a user query.
Query: "${query}"
Context Data: "${info || 'No direct search data available'}"
Today's Date: ${new Date().toDateString()}
Provide the best possible factual answer. Be CONCISE.`;

                const aiRes = await proxyLLM('openai', {
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: prompt }]
                });

                let finalResult = aiRes.data?.choices?.[0]?.message?.content || info;
                resolve({
                    success: true,
                    count: 1,
                    results: [{ Name: 'Web Summary', Content: finalResult }],
                    query,
                    type: 'internet'
                });
            });
        }).on('error', (e) => {
            logToFile(`Search connection error: ${e.message}`);
            resolve({ success: false, error: 'Internet connectivity issue' });
        });
    });
}

// --- RELAY DISCOVERY ---

async function relayDiscovery(body) {
    return new Promise((resolve) => {
        logToFile(`Relaying Desktop Discovery to localhost:${TUNNEL_PORT}...`);
        const postData = JSON.stringify(body);
        const options = {
            hostname: '127.0.0.1',
            port: TUNNEL_PORT,
            path: '/deep-discovery',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({ success: false, error: 'Failed to parse relay response' }); }
            });
        });

        req.on('error', (e) => {
            logToFile(`Relay error: ${e.message}`);
            resolve({ success: false, error: `Local tunnel offline (Port ${TUNNEL_PORT})` });
        });

        req.write(postData);
        req.end();
        setTimeout(() => { req.destroy(); resolve({ success: false, error: 'Relay timeout' }); }, 20000);
    });
}

function parseRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (e) { resolve({}); }
        });
    });
}

async function proxyLLM(provider, body) {
    return new Promise((resolve, reject) => {
        const providers = {
            openai: { hostname: 'api.openai.com', path: '/v1/chat/completions', auth: `Bearer ${process.env.VITE_OPENAI_API_KEY}` },
            cerebras: { hostname: 'api.cerebras.ai', path: '/v1/chat/completions', auth: `Bearer ${process.env.VITE_CEREBRAS_API_KEY}` }
        };
        const config = providers[provider] || providers.openai;
        const postData = JSON.stringify(body);
        const options = {
            hostname: config.hostname,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.auth,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch (e) { resolve({ status: res.statusCode, raw: data }); } });
        });
        req.on('error', e => reject(e)); req.write(postData); req.end();
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    logToFile(`${req.method} ${url.pathname}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    try {
        if (url.pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ACTIVE', version: '3.5.2 (Safe)' }));
            return;
        }
        if (url.pathname === '/deep-discovery' && req.method === 'POST') {
            const body = await parseRequestBody(req);
            const query = (body && body.query) ? String(body.query) : '';
            const queryLower = query.toLowerCase();
            const internetKeywords = ['weather', 'search', 'news', 'internet', 'web', 'online', 'who is', 'what happened', 'lookup', 'price'];

            if (internetKeywords.some(kw => queryLower.includes(kw))) {
                const result = await executeWebSearch(query);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else {
                const result = await relayDiscovery(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            }
            return;
        }
        res.writeHead(404); res.end();
    } catch (error) {
        logToFile(`UNCAUGHT ERROR: ${error.message}`);
        res.writeHead(500); res.end(JSON.stringify({ error: error.message }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    logToFile(`🚀 Bridge v3.5.2 (Safe) active on ${PORT}`);
});
