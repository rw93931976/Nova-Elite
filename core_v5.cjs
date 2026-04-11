const WebSocket = require('ws');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_AI_KEY;
const wss = new WebSocket.Server({ port: 3508, host: '127.0.0.1' });

console.log('🚀 [Core] IPv4 Loopback Live on Port 3508');

wss.on('connection', (ws) => {
    console.log('👤 [Core] Connection Received');
    const googleWs = new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession?rt=b&key=' + GOOGLE_API_KEY);

    googleWs.on('open', () => {
        console.log('✅ [Core] Brain: Connected to Google');
        googleWs.send(JSON.stringify({ setup: { model: "models/gemini-2.0-flash-exp", generation_config: { response_modalities: ["audio"] } } }));
    });

    ws.on('message', (data) => { if (googleWs.readyState === WebSocket.OPEN) googleWs.send(data); });
    googleWs.on('message', (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
    ws.on('close', () => googleWs.close());
    googleWs.on('close', () => ws.close());
});
