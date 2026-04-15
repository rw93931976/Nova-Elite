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
const vpsEnv = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const k = parts[0].trim();
            let v = parts.slice(1).join('=').trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
            vpsEnv[k] = v;
        }
    });
}

// 🔑 KEYS & SECRETS
const googleKey = vpsEnv['VITE_GOOGLE_AI_KEY'] || vpsEnv['VITE_GEMINI_API_KEY'];
const supabaseUrl = vpsEnv['VITE_SUPABASE_URL'];
const supabaseKey = vpsEnv['VITE_SUPABASE_ANON_KEY'];
const openAiKey = vpsEnv['VITE_OPENAI_API_KEY'];

log(`🔑 [Env] Sovereign Gateway Active. Google Key: ${googleKey ? 'OK' : 'MISSING'}`);

// --- 📡 SOVEREIGN LIVE RELAY (v11.0) ---
const RELAY_PORT = 3506;
const wss = new WebSocket.Server({ port: RELAY_PORT, host: '0.0.0.0' });

log(`🛰️ [Relay] Sovereign Live Gateway initializing on port ${RELAY_PORT}...`);

wss.on('connection', (ws) => {
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

                const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${googleKey}`;
                log(`📡 [Relay] Opening outbound stream to Google: ${model}`);

                // SOVEREIGN: Mimic browser origin to prevent 1008 Policy Violations
                googleSocket = new WebSocket(googleUrl, {
                    headers: {
                        'Origin': 'https://nova.mysimpleaihelp.com'
                    }
                });

                googleSocket.on('open', () => {
                    log('✅ [Relay] Sovereign Node handshaked with Google AI.');

                    const setupMsg = {
                        setup: {
                            model: model,
                            generationConfig: {
                                responseModalities: ["AUDIO"]
                            }
                        }
                    };
                    log(`📤 [Relay] Sending Minimal Setup: ${JSON.stringify(setupMsg)}`);
                    googleSocket.send(JSON.stringify(setupMsg));
                });

                googleSocket.on('message', (gMsg) => {
                    try {
                        const str = gMsg.toString();
                        if (str.trim().startsWith('{')) {
                            const data = JSON.parse(str);

                            // PROMPT TEST: DISABLED - Causing text-only responses
                            /*
                            if (data.setupComplete) {
                                log("✨ [Relay] Setup Complete. Sending Text Test Prompt...");
                                googleSocket.send(JSON.stringify({
                                    realtimeInput: {
                                        text: "Please say 'Sovereign Protocol Active' if you are receiving my signal clearly."
                                    }
                                }));
                            }
                            */

                            if (data.serverContent?.modelTurn?.parts) {
                                for (const part of data.serverContent.modelTurn.parts) {
                                    if (part.text) log(`🤖 [Brain] Gemini text part: ${part.text}`);
                                }
                            }

                            if (str.length < 1000) log(`🤖 [Brain] Gemini Message: ${str}`);
                            else log(`🤖 [Brain] Recv JSON from Gemini (${gMsg.length} bytes)`);
                        } else {
                            const hex = gMsg.slice(0, 16).toString('hex');
                            log(`🤖 [Brain] Recv Binary from Gemini (${gMsg.length} bytes). Hex: ${hex}...`);
                        }
                    } catch (e) {
                        log(`🤖 [Brain] Recv from Gemini (${gMsg.length} bytes)`);
                    }
                    if (ws.readyState === WebSocket.OPEN) ws.send(gMsg);
                });

                googleSocket.on('close', (code, reason) => {
                    log(`🔌 [Relay] Google session closed (Code: ${code}, Reason: ${reason})`);
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                });

                googleSocket.on('error', (err) => {
                    log(`❌ [Relay] Google Socket Error: ${err.message}`);
                    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: `Relay Error: ${err.message}` }));
                });

            } else if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                if (data.realtimeInput) {
                    const audio = data.realtimeInput.audio;
                    log(`🎤 [Brain] Forwarding Audio. Data Len: ${audio?.data?.length || 0}. Prefix: ${audio?.data?.substring(0, 50)}...`);
                }
                googleSocket.send(message.toString());
            }
        } catch (e) {
            console.log(`📡 [Brain] Forwarding Raw Data (${message.length} bytes)`);
            if (googleSocket && googleSocket.readyState === WebSocket.OPEN) googleSocket.send(message);
        }
    });

    ws.on('close', () => {
        log('👋 [Relay] Browser disconnected.');
        if (googleSocket) googleSocket.close();
    });
});

// --- REST OF BRIDGE (HTTP/SUPABASE) ---
const BRIDGE_PORT = 3505;
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'online', version: 'v10.0.0-SOVEREIGN', gateway: '3506 active' }));

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
    log(`[VocalMirror] Base Bridge active on port ${BRIDGE_PORT}`);
});

// Supabase Mesh Integration (Simplified for Handoff)
if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    log('🔗 [Mesh] Connected to Sovereign Database. Starting Speech Poller...');

    // --- RE-ENABLE SPEECH POLLING FOR LOCAL AUDIO ---
    const pollSpeech = async () => {
        try {
            const { data: jobs, error } = await supabase
                .from('relay_jobs')
                .select('*')
                .eq('status', 'pending')
                .eq('type', 'speech')
                .limit(1);

            if (error) throw error;

            if (jobs && jobs.length > 0) {
                const job = jobs[0];
                const text = job.payload.text;
                log(`🎤 [Speech] Received: "${text.substring(0, 50)}..."`);

                // Mark as processing
                await supabase.from('relay_jobs').update({ status: 'processing' }).eq('id', job.id);

                // Use OS-native TTS or Playback
                // Based on user report, we use PowerShell for Windows-native audio
                const sanitized = text.replace(/[\r\n]+/g, ' ').replace(/'/g, "''").replace(/"/g, '\"');
                const psCommand = `powershell -Command "Add-Type -AssemblyName System.speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like '*Zira*' } | Select-Object -First 1; if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }; $synth.Speak('${sanitized}')"`;

                exec(psCommand, { windowsHide: true }, async (err) => {
                    if (err) {
                        log(`🚨 [Speech] Playback Error: ${err.message}`);
                        await supabase.from('relay_jobs').update({ status: 'failed', result: { error: err.message } }).eq('id', job.id);
                    } else {
                        log(`✅ [Speech] Played successfully.`);
                        await supabase.from('relay_jobs').update({ status: 'completed', result: { played: true } }).eq('id', job.id);
                    }
                });
            }
        } catch (e) {
            // Silently retry
        }
        setTimeout(pollSpeech, 2000);
    };
    pollSpeech();
}
