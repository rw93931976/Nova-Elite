import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/aims/nova/.env' });

const PORT = 3505;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

const GEMINI_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BiDiGenerateContent?key=' + GEMINI_API_KEY;
const OPENAI_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/relay/health' || req.url === '/relay') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'SOVEREIGN_MASTER_ONLINE',
            capabilities: ['GEMINI', 'OPENAI_REALTIME'],
            handshake: 'NUCLEAR_HARBOR_V2'
        }));
    } else {
        res.writeHead(200);
        res.end('Sovereign Bridge ACTIVE - Capabilities: Gemini, OpenAI');
    }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws, req) => {
    console.log('📡 [NuclearBridge] New Session | Path: ' + req.url);

    let targetWs = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (!targetWs) {
                if (data.type === 'setup') {
                    console.log('✨ [NuclearBridge] Mode: GEMINI');
                    targetWs = new WebSocket(GEMINI_URL);
                } else if (data.type === 'session.update' || data.type === 'response.create') {
                    console.log('✨ [NuclearBridge] Mode: OPENAI REALTIME');
                    targetWs = new WebSocket(OPENAI_URL, {
                        headers: {
                            'Authorization': 'Bearer ' + OPENAI_API_KEY,
                            'OpenAI-Beta': 'realtime=v1'
                        }
                    });
                }

                if (targetWs) {
                    targetWs.on('open', () => {
                        console.log('🔗 [NuclearBridge] Tunnel Established.');
                        targetWs.send(message.toString());
                    });

                    targetWs.on('message', (msg) => {
                        ws.send(msg.toString());
                    });

                    targetWs.on('error', (err) => {
                        console.error('❌ [NuclearBridge] Target Error:', err);
                        ws.close(1011, 'Target Error');
                    });

                    targetWs.on('close', (code, reason) => {
                        ws.close();
                    });
                }
            } else if (targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(message.toString());
            }
        } catch (e) {
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(message);
            }
        }
    });

    ws.on('close', () => {
        if (targetWs) targetWs.close();
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 [Sovereign-Master] High-Availability Bridge Listening on 0.0.0.0:' + PORT);
});
