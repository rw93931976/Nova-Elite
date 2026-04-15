/**
 * SovereignBridge-v10.cjs
 * The Unified Sensory Link for Nova Elite
 * 
 * Port: 3505 (HTTP) | 3506 (WebSocket)
 * Components: Dashboard, Deep Discovery (PS), File System APIs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3505;
const WS_PORT = 3506;
const USER_HOME = process.env.USERPROFILE || 'C:\\Users\\Ray';

// Helper to log with timestamps
function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    try {
        // 1. HEALTH CHECK
        if (pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ACTIVE', version: '10.0-Elite', node: process.version }));
            return;
        }

        // 2. FILE READ API
        if (pathname === '/api/file/read' && req.method === 'GET') {
            const filePath = url.searchParams.get('path');
            if (!filePath) {
                res.writeHead(400); res.end("Missing path"); return;
            }
            log(`Reading file: ${filePath}`);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, content }));
            } else {
                res.writeHead(404); res.end("File not found");
            }
            return;
        }

        // 3. FILE WRITE API
        if (pathname === '/api/file/write' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const data = JSON.parse(body);
                log(`Writing file: ${data.path}`);
                fs.writeFileSync(data.path, data.content);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        // 4. FILE LIST API (Directory Search)
        if (pathname === '/api/file/list' && req.method === 'GET') {
            const dirPath = url.searchParams.get('path') || USER_HOME;
            log(`Listing directory: ${dirPath}`);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, files }));
            } else {
                res.writeHead(404); res.end("Directory not found");
            }
            return;
        }

        // 5. DEEP DISCOVERY (PowerShell Integration)
        if (pathname === '/deep-discovery' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const payload = JSON.parse(body);
                const query = payload.query || '*';
                log(`Executing Deep Discovery: ${query}`);

                // Using the optimized DS-STAR PowerShell pattern
                const psCommand = `Get-ChildItem -Path "${USER_HOME}\\Desktop" -Filter "*${query}*" -Recurse -Depth 2 -ErrorAction SilentlyContinue | Select-Object Name, FullName | ConvertTo-Json`;
                const ps = spawn('powershell.exe', ['-Command', psCommand]);

                let output = '';
                ps.stdout.on('data', d => output += d);
                ps.on('close', () => {
                    let results = [];
                    try { results = JSON.parse(output || '[]'); } catch (e) { }
                    if (!Array.isArray(results)) results = [results];

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        count: results.length,
                        results: results.map(r => ({ title: r.Name, url: r.FullName, snippet: 'Local Desktop Match' }))
                    }));
                });
            });
            return;
        }

        // 6. DASHBOARD (Fallback)
        if (pathname === '/' || pathname === '/dashboard') {
            const dashPath = path.join(__dirname, 'swarm_dashboard.html');
            if (fs.existsSync(dashPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(dashPath).pipe(res);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end("Sovereign Bridge v10.0 Active. Ready for sensor input.");
            }
            return;
        }

        res.writeHead(404);
        res.end("Not Found");

    } catch (e) {
        log(`Critical Error: ${e.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
    }
});

// WebSocket Server for Sovereign Core
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on('connection', (ws) => {
    log('Sovereign Core Connection Established');
    ws.on('message', (msg) => {
        log(`WS Received: ${msg}`);
        ws.send(JSON.stringify({ type: 'ACK', timestamp: Date.now() }));
    });
});

server.listen(PORT, '0.0.0.0', () => {
    log(`🚀 Sovereign Bridge v10.0 Active on Port ${PORT}`);
    log(`⚡ Sovereign Core WebSocket Active on Port ${WS_PORT}`);
});
