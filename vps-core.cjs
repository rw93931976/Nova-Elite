const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const processEnv = process.env;
const INSTANCE_ID = Math.random().toString(36).substring(2, 10);
const START_TIME = Date.now();
const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');
const express = require('express');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try {
        fs.appendFileSync(path.join(__dirname, 'bridge.log'), formatted + '\n');
    } catch (e) { }
};

// 🛠️ CONFIG: Load .env
const sovEnvPath = path.join(__dirname, 'sovereign.env');
const legacyEnvPath = path.join(__dirname, '.env');
const envPath = fs.existsSync(sovEnvPath) ? sovEnvPath : legacyEnvPath;
const env = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const k = parts[0].trim();
            let v = parts.slice(1).join('=').trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
            env[k] = v;
        }
    });
}

// 🔑 KEYS & SECRETS
const googleKey = env['VITE_GOOGLE_AI_KEY'] || env['VITE_GEMINI_API_KEY'];
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const openAiKey = env['VITE_OPENAI_API_KEY'];

log(`🔑 [Env] Sovereign Gateway Active. Google Key: ${googleKey ? 'OK' : 'MISSING'}`);

// --- 📡 SOVEREIGN LIVE RELAY (v11.0) ---
const BRIDGE_PORT = 3505;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

log(`🛰️ [Relay] Sovereign Live Gateway initializing on unified port ${BRIDGE_PORT}...`);

wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('key');

    if (key !== 'sovereign-secret-12345') {
        log('❌ [Relay] Connection REJECTED: Invalid or missing key.');
        ws.close(4001, 'Unauthorized');
        return;
    }

    log('🤝 [Relay] Browser handshaking with Sovereign Node.');
    let googleSocket = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'setup') {
                log('🛠️ [Relay] Configuring Gemini 3.1 Flash Live session...');
                const model = "models/gemini-2.0-flash-exp";

                if (!googleKey) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Relay Error: No API Key found on VPS.' }));
                    return;
                }

                const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession?key=${googleKey}`;
                log(`📡 [Relay] Opening outbound stream to Google: ${model}`);
                googleSocket = new WebSocket(googleUrl);

                googleSocket.on('open', () => {
                    log('✅ [Relay] Sovereign Node handshaked with Google AI.');
                    googleSocket.send(JSON.stringify({
                        setup: {
                            model: model,
                            generation_config: data.setup?.generation_config || { response_modalities: ["audio"] },
                            system_instruction: data.setup?.system_instruction || { parts: [{ text: "You are Nova Elite, Ray's Sovereign Peer." }] }
                        }
                    }));
                });

                googleSocket.on('message', (gMsg) => {
                    if (ws.readyState === WebSocket.OPEN) ws.send(gMsg);
                });

                googleSocket.on('close', () => {
                    log('🔌 [Relay] Google session ended.');
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                });

                googleSocket.on('error', (err) => {
                    log(`❌ [Relay] Google Socket Error: ${err.message}`);
                    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: 'Relay: Google Connection Failed' }));
                });

            } else if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(message.toString());
            }
        } catch (e) {
            if (googleSocket && googleSocket.readyState === WebSocket.OPEN) googleSocket.send(message);
        }
    });

    ws.on('close', () => {
        log('👋 [Relay] Browser disconnected.');
        if (googleSocket) googleSocket.close();
    });
});

// --- REST OF BRIDGE ---
app.get('/health', (req, res) => res.json({ status: 'online', version: 'v11.0.0-UNIFIED', gateway: '3505 (WS/HTTP)' }));

server.listen(BRIDGE_PORT, '0.0.0.0', () => {
    log(`[VocalMirror] Unified Bridge active on port ${BRIDGE_PORT}`);
});

// Supabase Mesh Integration (Simplified for Handoff)
if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    log('🔗 [Mesh] Connected to Sovereign Database.');
}
