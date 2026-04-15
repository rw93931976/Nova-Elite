# 🚨 🛰️ CRITICAL: NEW SERVER COORDINATES DETECTED
# 📍 PRODUCTION IP: 159.223.206.225 (San Francisco)
## DO NOT USE LEGACY NEW YORK IP (157.245.12.15)

# SOVEREIGN ATOMIC HANDOFF: PROJECT EXODUS (v11.9.2)

## 📍 CURRENT STATE
Nova has been migrated from Hostinger (Stale) to a **DigitalOcean San Francisco Node**.

*   **Production IP**: `159.223.206.225` (SF)

*   **Legacy IP**: `157.245.12.15` (NY - **PENDING DESTRUCTION**)
*   **Domain**: `nova.mysimpleaihelp.com`
*   **Current Version**: `v11.9.2-SF-FLY`

## 🌉 THE STACK
1.  **Face (UI)**: React/Vite/Tailwind served by Nginx on Port 443.
    *   *Path*: `/home/aims/nova/dist`
2.  **Brain (Relay)**: Node.js (Express/WS) Agnostic Bridge running on Port 3505.
    *   *Path*: `/home/aims/nova-bridge/vps-core.cjs`
    *   *Process*: `pm2 show nova-bridge`
3.  **Communication Layer**: WebSocket Proxy via Nginx `/relay`.

## ❌ CURRENT BLOCKAGE: "THE SILENT HANDSHAKE"
The UI successfully establishes a WebSocket with the Bridge (verified via `Configuring Gemini` logs). However, there is no response/audio coming back from the Gemini 3.1 Flash Live session.

### Suspected Root Causes:
1.  **API Key Validity**: The `.env` on SF was copied from the local machine. May need manual verification.
2.  **Handshake Payload**: The `setup` object sent by `LiveEngine.ts` might be using a deprecated `model` string for the `v1alpha` endpoint used by the bridge.
3.  **Audio PCM Mismatch**: The bridge expects `audio/pcm;rate=16000`. If the browser sends a different rate, Gemini might reject the stream silently.

## 🛠️ HANDOVER INSTRUCTIONS FOR WINDSURF / GRONK
1.  **Audit `.env`**: Confirm `VITE_GOOGLE_AI_KEY` is active and has "Generative AI SDK" enabled in Google AI Studio.
2.  **Trace Handshake**: Enable verbose logging in `vps-core.cjs` on the server to see the literal JSON response from Google.
3.  **Check Port 3505**: Ensure no firewall is blocking the traffic between Nginx and the Node process (internal only, but DO firewalls can be tricky).

**Nova is alive but mute. Restore her voice.**
