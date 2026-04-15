const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const googleKey = process.env.VITE_GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
if (!googleKey) {
    console.error('❌ Missing Google API Key in .env');
    process.exit(1);
}

const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${googleKey}`;
console.log(`📡 Connecting to: ${url}`);

const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('✅ Connection Opened!');
    const setup = {
        setup: {
            model: "models/gemini-3.1-flash-live-preview",
        }
    };
    console.log('📤 Sending Setup...');
    ws.send(JSON.stringify(setup));
});

ws.on('message', (data) => {
    console.log('📩 Received:', data.toString());
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Closed: ${code} ${reason}`);
    process.exit(0);
});

setTimeout(() => {
    console.log('⏰ Timeout waiting for Gemini');
    process.exit(1);
}, 10000);
