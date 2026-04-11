const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const wss = new WebSocket.Server({ noServer: true });
const SOVEREIGN_SECRET = process.env.SOVEREIGN_SECRET || 'sovereign-secret-12345';

console.log('🛰️ [Relay] Sovereign Relay Live on Port 3511');

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Relay Active');
});

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const key = url.searchParams.get('key');

    if (key !== SOVEREIGN_SECRET) {
        console.log('❌ [Relay] Invalid Secret');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] UI Connected. Opening Bridge to Core (3507)...');

        const core = new WebSocket('ws://127.0.0.1:3507');

        core.on('open', () => {
            console.log('✅ [Relay] Bridge to Core OPEN');
            wss.emit('connection', ws, request);
        });

        core.on('message', (data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        ws.on('message', (data) => {
            if (core.readyState === WebSocket.OPEN) core.send(data);
        });

        core.on('error', (err) => console.error('❌ [Relay] Core Error:', err.message));
        ws.on('close', () => core.close());
        core.on('close', () => ws.close());
    });
});

server.listen(3511, '0.0.0.0');
