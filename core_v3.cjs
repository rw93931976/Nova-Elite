const WebSocket = require('ws');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_AI_KEY;
const wss = new WebSocket.Server({ port: 3505, host: '0.0.0.0' });

console.log('🚀 [Core] Nova Level 5 Gemini 2.0 Multimodal Realtime Live on Port 3505 (0.0.0.0)');

wss.on('connection', (ws) => {
    console.log('👤 [Core] Client Handshake Received (Relay Bridge Connected)');

    const url = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession?rt=b&key=' + GOOGLE_API_KEY;
    const googleWs = new WebSocket(url);

    googleWs.on('open', () => {
        console.log('✅ [Core] Brain: Connected to Google Gemini 2.0');
        // Configure for audio
        const setup = {
            setup: {
                model: "models/gemini-2.0-flash-exp",
                generation_config: {
                    response_modalities: ["audio"]
                }
            }
        };
        googleWs.send(JSON.stringify(setup));
    });

    ws.on('message', (data) => {
        if (googleWs.readyState === WebSocket.OPEN) {
            googleWs.send(data);
        }
    });

    googleWs.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    googleWs.on('error', (err) => console.error('❌ [Core] Brain Error: ', err.message));
    ws.on('error', (err) => console.error('❌ [Core] Client Bridge Error: ', err.message));

    ws.on('close', () => {
        console.log('💤 [Core] Client Bridge Closed');
        googleWs.close();
    });

    googleWs.on('close', () => {
        console.log('💤 [Core] Brain Connection Closed');
        ws.close();
    });
});
