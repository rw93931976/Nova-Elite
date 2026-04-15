import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

// ROBUST LOGGING
const log = (msg) => {
    const time = new Date().toISOString();
    const entry = \`[\${time}] \${msg}\n\`;
    process.stdout.write(entry);
    try {
        fs.appendFileSync('/home/aims/nova/relay_debug.log', entry);
    } catch (e) {
        process.stdout.write(\`LOG_ERROR: \${e.message}\n\`);
    }
};

log('RELAY_BOOT: Initializing...');

try {
    dotenv.config();
    const API_KEY = process.env.GEMINI_API_KEY;
    const PORT = process.env.PORT || 3505;

    if (!API_KEY) {
        log('ERROR: GEMINI_API_KEY missing in .env');
        process.exit(1);
    }

    const wss = new WebSocketServer({ port: PORT });
    log(\`RELAY_SERVER: Listening on Port \${PORT}\`);

    wss.on('connection', (clientWs, req) => {
        log(\`CLIENT_CONNECTED: \${req.url}\`);
        let geminiWs = null;

        clientWs.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'setup') {
                    log('SETUP_RECEIVED: Initiating Gemini Handshake...');
                    const url = \`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.MultimodalLive?key=\${API_KEY}\`;
                    
                    geminiWs = new WebSocket(url);

                    geminiWs.on('open', () => {
                        log('GEMINI_CONNECTED: Handshake Success');
                        clientWs.send(JSON.stringify({ setupComplete: true }));
                    });

                    geminiWs.on('message', (geminiMsg) => {
                        clientWs.send(geminiMsg.toString());
                    });

                    geminiWs.on('error', (err) => {
                        log(\`GEMINI_ERROR: \${err.message}\`);
                        clientWs.send(JSON.stringify({ error: err.message }));
                    });

                    geminiWs.on('close', (code) => {
                        log(\`GEMINI_CLOSED: Code \${code}\`);
                        clientWs.close();
                    });
                } else if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                    geminiWs.send(message);
                }
            } catch (err) {
                log(\`MESSAGE_ERROR: \${err.message}\`);
            }
        });

        clientWs.on('close', () => {
            log('CLIENT_DISCONNECTED');
            if (geminiWs) {
                try { geminiWs.close(); } catch (e) {}
            }
        });
    });

} catch (err) {
    log(\`FATAL_CRASH: \${err.message}\`);
    process.exit(1);
}
