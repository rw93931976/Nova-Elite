const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const RELAY_PORT = 3512;
const BACKEND_URL = 'ws://localhost:3506?key=sovereign-secret-12345';

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Sovereign Relay Active');
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    console.log(`📡 [Relay] Upgrade request: ${request.url}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('🤝 [Relay] Tunnel starting. Connecting to Brain...');

        const core = new WebSocket(BACKEND_URL);

        core.on('open', () => {
            console.log('✅ [Relay] Connected to Brain');
        });

        ws.on('message', (data) => {
            console.log(`📡 [Relay] Forwarding to Brain (${data.length} bytes)`);
            if (core.readyState === WebSocket.OPEN) core.send(data);
        });

        core.on('message', (data, isBinary) => {
            console.log(`🧠 [Relay] Recv from Brain (${data.length} bytes, binary: ${isBinary})`);
            if (ws.readyState === WebSocket.OPEN) ws.send(data, { binary: isBinary });
        });

        ws.on('close', () => {
            console.log('👋 [Relay] Client disconnected');
            core.close();
        });

        core.on('close', () => {
            console.log('🔌 [Relay] Brain disconnected');
            ws.close();
        });

        ws.on('error', (err) => console.error('❌ [Relay] Client WS Error:', err.message));
        core.on('error', (err) => console.error('❌ [Relay] Brain Core Error:', err.message));
    });
});

server.listen(RELAY_PORT, '127.0.0.1', () => {
    console.log(`🛰️ [Relay] Sovereign Relay Live on 127.0.0.1:${RELAY_PORT}`);
});
