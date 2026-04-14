const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load Environment
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const RELAY_PORT = process.env.RELAY_PORT || 4002;
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

if (!GOOGLE_AI_KEY) {
    console.error("❌ [Bridge] FATAL: GOOGLE_AI_KEY is missing from .env");
    process.exit(1);
}

console.log(`🛰️ [Bridge] Starting in San Francisco Node...`);
console.log(`🔑 [Bridge] Key detected (ends in ${GOOGLE_AI_KEY.slice(-4)})`);

// HTTP Interface
app.get("/health", (req, res) => {
    res.json({ status: "online", node: "SF-SOVEREIGN", pki: true });
});

// WebSocket Relay logic
wss.on("connection", (clientWs, req) => {
    console.log("🔗 [Relay] Client linked from", req.socket.remoteAddress);

    // Connect to Google AI Gemini Multimodal Live API
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiGenerateContent?key=${GOOGLE_AI_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);

    // Proxy Client -> Gemini
    clientWs.on("message", (message) => {
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(message);
        }
    });

    // Proxy Gemini -> Client
    geminiWs.on("open", () => {
        console.log("✨ [Relay] Linked to Google AI Multimodal Engine");
        clientWs.send(JSON.stringify({ setupComplete: true }));
    });

    geminiWs.on("message", (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    });

    geminiWs.on("close", (code, reason) => {
        console.log(`🔌 [Relay] Gemini disconnected (Code: ${code}, Reason: ${reason})`);
        clientWs.close(code, reason);
    });

    geminiWs.on("error", (error) => {
        console.error("❌ [Relay] Gemini Engine Error:", error);
        clientWs.send(JSON.stringify({ error: "Gemini Engine Handshake Failed" }));
    });

    clientWs.on("close", () => {
        console.log("🔌 [Relay] Client unlinked.");
        geminiWs.close();
    });
});

// Upgrade HTTP to WS
server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === "/relay") {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(RELAY_PORT, "0.0.0.0", () => {
    console.log(`⚡ [Bridge] Sovereign Relay listening on Port ${RELAY_PORT}`);
});
