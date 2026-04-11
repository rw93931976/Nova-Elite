const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const wss = new WebSocket.Server({ noServer: true });
const SOVEREIGN_SECRET = process.env.SOVEREIGN_SECRET || 'sovereign-secret-12345';

console.log('🛰️ [Relay] Sovereign Relay Live on Port 3511');

const server = http.createServer((req, res) => {
    console.log(`🌐 [Relay] GET: ${req.url}`);
    res.writeHead(200);
    res.end('Sovereign Relay Active');
});

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const key = url.searchParams.get('key');

    console.log(`🔑 [Relay] Upgrade Request: ${request.url}`);

    if (key !== SOVEREIGN_SECRET) {
        console.log('❌ [Relay] Invalid Secret');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] UI Handshake Success. Opening Bridge to Core...');

        const core = new WebSocket('ws://127.0.0.1:3505');

        core.on('open', () => {
            console.log('✅ [Relay] Bridge to Core: OPEN');
            wss.emit('connection', ws, request);
        });

        core.on('message', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        ws.on('message', (data) => {
            if (core.readyState === WebSocket.OPEN) {
                core.send(data);
            }
        });

        core.on('error', (err) => console.error('❌ [Relay] Core Bridge Error: ', err.message));
        ws.on('error', (err) => console.error('❌ [Relay] UI Bridge Error: ', err.message));

        core.on('close', () => ws.close());
        ws.on('close', () => core.close());
    });
});

server.listen(3511, '0.0.0.0', () => {
    console.log('🛰️ [Relay] Binding Successful on Port 3511');
});
