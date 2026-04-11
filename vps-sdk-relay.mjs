import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

var GEMINI_API_KEY = process.env.GEMINI_API_KEY;
var MODEL_NAME = 'gemini-2.5-flash-native-audio-latest';
var GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' + GEMINI_API_KEY;

var SYSTEM_PROMPT = 'You are Nova, Ray\'s Elite Personal Partner. ' +
    'TONE: Warm, conversational, friendly, and sharp. Speak smoothly and naturally like a real human. ' +
    'MANDATE: NEVER APOLOGIZE. Never say "As an AI..." ' +
    'CONVERSATION FLOW: Absolutely NO robotic jargon or stiff military replies (e.g., never say "Affirmative," "Parameters," "Calibration," or "Refinement applied"). Do not give status updates when asked to change your behavior. Just adapt and chat naturally.';

var wss = new WebSocketServer({ port: 3505 });

console.log('[Sovereign Relay v15.0] Active on Port 3505');
console.log('[Relay] Model: ' + MODEL_NAME);

wss.on('connection', function (browserWs) {
    console.log('[Relay] Browser connected.');
    var geminiWs = null;

    geminiWs = new WebSocket(GEMINI_WS_URL);

    geminiWs.on('open', function () {
        console.log('[Relay] Connected to Gemini Live API.');

        var now = new Date();
        var timeStr = now.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'long' });
        var dynamicPrompt = SYSTEM_PROMPT + '\nCURRENT SYSTEM TIME: ' + timeStr + ' (Central Time).';

        var setupMessage = {
            setup: {
                model: 'models/' + MODEL_NAME,
                generationConfig: {
                    responseModalities: ['AUDIO']
                },
                systemInstruction: {
                    parts: [{ text: dynamicPrompt }]
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {}
            }
        };

        geminiWs.send(JSON.stringify(setupMessage));
        console.log('[Relay] Setup sent.');
    });

    geminiWs.on('message', function (data) {
        try {
            var response = JSON.parse(data.toString());

            if (response.setupComplete !== undefined) {
                console.log('[Relay] SETUP COMPLETE - Session ready!');
                if (browserWs.readyState === WebSocket.OPEN) {
                    browserWs.send(JSON.stringify({ setupComplete: true }));
                }
                return;
            }

            if (response.serverContent) {
                var sc = response.serverContent;
                if (sc.inputTranscription) {
                    console.log('[User]: ' + sc.inputTranscription.text);
                }
                if (sc.outputTranscription) {
                    console.log('[Nova]: ' + sc.outputTranscription.text);
                }
                if (sc.modelTurn && sc.modelTurn.parts) {
                    var audioParts = sc.modelTurn.parts.filter(function (p) { return p.inlineData; });
                    if (audioParts.length > 0) {
                        console.log('[Relay] Forwarding ' + audioParts.length + ' audio chunk(s).');
                    }
                }
            }

            // Forward everything to browser
            if (browserWs.readyState === WebSocket.OPEN) {
                browserWs.send(data.toString());
            }
        } catch (err) {
            if (browserWs.readyState === WebSocket.OPEN) {
                browserWs.send(data);
            }
        }
    });

    geminiWs.on('error', function (err) {
        console.error('[Relay] Gemini Error: ' + err.message);
    });

    geminiWs.on('close', function (code, reason) {
        console.log('[Relay] Gemini disconnected (Code: ' + code + ')');
        if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ error: 'Gemini closed: ' + code }));
        }
    });

    // Relay browser audio to Gemini
    browserWs.on('message', function (data) {
        try {
            var message = JSON.parse(data.toString());

            if (message.realtimeInput) {
                if (message.realtimeInput.mediaChunks) {
                    // Convert deprecated mediaChunks to documented audio format
                    for (var i = 0; i < message.realtimeInput.mediaChunks.length; i++) {
                        var chunk = message.realtimeInput.mediaChunks[i];
                        var docFormat = {
                            realtimeInput: {
                                audio: {
                                    data: chunk.data,
                                    mimeType: chunk.mimeType || 'audio/pcm;rate=16000'
                                }
                            }
                        };
                        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                            geminiWs.send(JSON.stringify(docFormat));
                        }
                    }
                } else if (message.realtimeInput.audio) {
                    // Already in documented format
                    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                        geminiWs.send(data.toString());
                    }
                }
            }
        } catch (err) {
            // ignore
        }
    });

    browserWs.on('close', function () {
        console.log('[Relay] Browser disconnected.');
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
    });
});
