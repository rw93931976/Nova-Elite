const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const log = (msg) => {
    const formatted = "[" + new Date().toISOString() + "] " + msg;
    console.log(formatted);
    try { fs.appendFileSync(path.join(__dirname, "bridge.log"), formatted + "\n"); } catch (e) { }
};

const vpsEnv = process.env;
const googleKey = vpsEnv["VITE_GOOGLE_AI_KEY"] || vpsEnv["VITE_GEMINI_API_KEY"];

const RELAY_PORT = 4001;
const wss = new WebSocket.Server({ port: RELAY_PORT, host: "0.0.0.0" });

log("🛰️ [Relay] Sovereign SF Gateway Active on Port 4001");

wss.on("connection", (ws) => {
    log("🤝 [Relay] Browser handshaked.");
    let googleSocket = null;
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.ping();
        else clearInterval(heartbeat);
    }, 15000);

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === "setup") {
                log("📡 [Relay] Opening outbound stream to Google AI...");
                const googleUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + googleKey;

                googleSocket = new WebSocket(googleUrl, { headers: { "Origin": "https://nova.mysimpleaihelp.com" } });

                googleSocket.on("error", (err) => { log("❌ [Relay] Google Socket Error: " + err.message); });

                googleSocket.on("open", () => {
                    log("✅ [Relay] Connected to Google AI.");
                    googleSocket.send(message);
                });

                googleSocket.on("message", (gMsg) => {
                    if (ws.readyState !== WebSocket.OPEN) return;
                    const str = gMsg.toString();
                    if (str.includes("setupComplete")) {
                        log("✨ [Relay] Setup Complete.");
                        googleSocket.send(JSON.stringify({
                            realtimeInput: { text: "Sovereign Protocol stabilized. San Francisco is active and her heart is beating at 15s." }
                        }));
                    }
                    ws.send(str);
                });

                googleSocket.on("close", () => { log("🔌 [Relay] Google session closed."); ws.close(); });
            } else if (googleSocket && googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(message);
            }
        } catch (e) {
            if (googleSocket && googleSocket.readyState === WebSocket.OPEN) googleSocket.send(message);
        }
    });

    ws.on("close", () => { clearInterval(heartbeat); if (googleSocket) googleSocket.close(); });
});

const BRIDGE_PORT = 4000;
const app = express();
app.get("/health", (req, res) => res.json({ status: "online", node: "San Francisco", relay: "4001" }));
app.get("/", (req, res) => res.json({
    status: "online",
    node: "San Francisco",
    mission: "Nova-Elite Sovereign",
    status_detail: "West Coast logic-bridge synchronized on Port 4000/4001."
}));
app.listen(BRIDGE_PORT, "0.0.0.0", () => { log("📍 [VocalMirror] Node logic active on port 4000"); });
