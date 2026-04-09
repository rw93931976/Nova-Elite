const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const wss = new WebSocket.Server({ noServer: true });
const SOVEREIGN_SECRET = process.env.SOVEREIGN_SECRET || 'sovereign-secret-12345';

console.log('🛰️ [Relay] Sovereign Relay Live on 127.0.0.1:3515');

const server = http.createServer((req, res) => { res.writeHead(200); res.end('Relay Active'); });

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const key = url.searchParams.get('key');
    if (key !== SOVEREIGN_SECRET) { socket.destroy(); return; }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] Bridge Opening...');
        const core = new WebSocket('ws://127.0.0.1:3509');
        core.on('open', () => { console.log('✅ [Relay] Bridge OPEN'); wss.emit('connection', ws, request); });
        core.on('message', (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
        ws.on('message', (data) => { if (core.readyState === WebSocket.OPEN) core.send(data); });
        core.on('close', () => ws.close());
        ws.on('close', () => core.close());
    });
});

server.listen(3515, '127.0.0.1');
