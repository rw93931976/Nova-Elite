// NovaSuperBridge.cjs – v3.5.1 – Universal VPS Version (Relay Mode with Enhanced Logging)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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

// --- INTERNET SEARCH LOGIC (v3.1 Scraper) ---

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

                if (!info) {
                    logToFile(`DDG API empty. Trying Scraper Fallback...`);
                    try {
                        const scraperUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
                        const scraperData = await new Promise((resScrape) => {
                            https.get(scraperUrl, (sRes) => {
                                let sData = '';
                                sRes.on('data', c => sData += c);
                                sRes.on('end', () => resScrape(sData));
                            }).on('error', () => resScrape(''));
                        });
                        const snippets = scraperData.match(/<a class="result__snippet"(.*?)>(.*?)<\/a>/g);
                        if (snippets) {
                            info = snippets.slice(0, 3).map(s => s.replace(/<[^>]*>/g, '')).join('\n');
                        }
                    } catch (err) { }
                }

                const prompt = `You are providing REAL-TIME internet data for a user query.
Query: "${query}"
Context Data: "${info || 'No direct search data available'}"
Today's Date: ${new Date().toDateString()}

STRICT RULES:
- NEVER say "I am a large language model" or "I don't have real-time access."
- Provide the best possible factual answer using snippets and internal knowledge.
- Be CONCISE and natural.`;

                const aiRes = await proxyLLM('openai', {
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: prompt }]
                });

                let finalResult = aiRes.data?.choices?.[0]?.message?.content || info;
                if (!finalResult) finalResult = `I couldn't find a direct real-time update, but for this time of year it's typically seasonal.`;

                logToFile(`Final Synthesis: ${finalResult.slice(0, 50)}...`);
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

// --- RELAY DISCOVERY (BRIDGE-TO-BRIDGE) ---

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
                try {
                    logToFile(`Received response from tunnel: ${data.slice(0, 50)}...`);
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    logToFile(`Failed to parse relay response: ${e.message}`);
                    resolve({ success: false, error: 'Failed to parse relay response' });
                }
            });
        });

        req.on('error', (e) => {
            logToFile(`Relay error: ${e.message}`);
            resolve({ success: false, error: `Local tunnel offline (Port ${TUNNEL_PORT})` });
        });

        req.write(postData);
        req.end();
        setTimeout(() => {
            req.destroy();
            logToFile(`Relay timeout after 20s`);
            resolve({ success: false, error: 'Relay timeout' });
        }, 20000);
    });
}

function parseRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                if (!body) {
                    logToFile('Empty request body received.');
                    resolve({});
                    return;
                }
                const parsed = JSON.parse(body);
                logToFile(`Body parsed successfully: ${JSON.stringify(parsed).slice(0, 50)}...`);
                resolve(parsed || {});
            } catch (e) {
                logToFile(`JSON Parse error: ${e.message} | Body: ${body.slice(0, 50)}`);
                resolve({});
            }
        });
        req.on('error', (e) => {
            logToFile(`Request stream error: ${e.message}`);
            resolve({});
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
            res.end(JSON.stringify({ status: 'ACTIVE', version: '3.5.1 (Diagnostic)' }));
            return;
        }
        if (url.pathname === '/deep-discovery' && req.method === 'POST') {
            const body = await parseRequestBody(req);
            const query = body && body.query ? String(body.query) : '';
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
        if (url.pathname === '/api/llm' && req.method === 'POST') {
            const body = await parseRequestBody(req);
            const result = await proxyLLM(body.provider || 'cerebras', body.payload);
            res.writeHead(result.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.data || { raw: result.raw }));
            return;
        }
        res.writeHead(404); res.end();
    } catch (error) {
        logToFile(`UNCAUGHT ERROR: ${error.message}\n${error.stack}`);
        res.writeHead(500); res.end(JSON.stringify({ error: error.message }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    logToFile(`ðŸš€ Bridge v3.5.1 (Diagnostic) active on ${PORT}`);
});
