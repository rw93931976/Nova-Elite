const WebSocket = require('ws');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_AI_KEY;
const PORT = 4001;

console.log('🚀 [Core] Sovereign Brain Initializing...');

const wss = new WebSocket.Server({ port: PORT, host: '127.0.0.1' });

wss.on('connection', (ws) => {
    console.log('👤 [Core] Connection Received');
    if (!GOOGLE_API_KEY) console.error('⚠️ [Core] WARNING: GOOGLE_API_KEY is undefined!');
    const googleUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' + GOOGLE_API_KEY;
    console.log('🔗 [Core] Connecting to:', googleUrl.split('key=')[0] + 'key=REDACTED');
    const googleWs = new WebSocket(googleUrl);

    googleWs.on('open', () => {
        console.log('✅ [Core] Brain: Connected to Google Gemini');
        googleWs.send(JSON.stringify({
            setup: {
                model: "models/gemini-2.0-flash-exp",
                generation_config: { response_modalities: ["audio"] }
            }
        }));
    });

    ws.on('message', (data) => {
        if (googleWs.readyState === WebSocket.OPEN) googleWs.send(data);
    });

    googleWs.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    googleWs.on('error', (e) => console.error('❌ [Core] Brain Error:', e.message));
    ws.on('error', (e) => console.error('❌ [Core] Client Error:', e.message));

    ws.on('close', () => { console.log('👤 [Core] Client Closed'); googleWs.close(); });
    googleWs.on('close', () => { console.log('✅ [Core] Brain Closed'); ws.close(); });
});

console.log(`🚀 [Core] IPv4 Authority Active on Port ${PORT}`);
