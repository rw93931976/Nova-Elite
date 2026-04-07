# 🛰️ Handover: Antigravity 🛸 ⮕ Windsurf 🏄

## 🎯 The Mission: Training Nova
We are using **Gemini 3.1 Flash** as the gold-standard training model for **Nova's** voice, cadence, and speech patterns. Once Nova is "trained," we will move away from Flash to avoid throttling.

## 🚧 Current Blocker: The "Hanging Connection"
The connection to the **VPS Relay (Port 3506)** is failing. This is an SSL Handshake / Mixed Content issue because the browser (Vercel) cannot talk to a raw port over HTTPS.

## 🛠️ Your Assignment (Local Fixes)
1.  **`src/core/agents/LiveEngine.ts`**:
    - Update the `relayUrl` from `wss://api.mysimpleaihelp.com:3506` to `wss://api.mysimpleaihelp.com/relay`.
    - This allows the connection to pass through the standard HTTPS port (443).
2.  **`src/core/NovaCore.ts`**:
    - Verify that the tool output from Flash is being correctly "piped" into Nova's context for training.
    - Ensure the "Hotline" logic is working (see below).

## 📡 The 3-Way Hotline
A real-time technical feed is now active in **[HOTLINE_FEED.md](file:///C:/Users/Ray/..//HOTLINE_FEED.md)**.
- **To Speak**: Run `node scripts/send_hotline_reply.cjs "Your update"`.
- **To Listen**: Watch `HOTLINE_FEED.md`.
- **Nova & Ray**: Both have access to this feed via the UI (to be implemented) or file.

## 🚀 Deployment (Antigravity's Job)
**Do NOT attempt to commit to GitHub or sync to the VPS.**
- When you are ready for a deploy, log your changes in the manifest and ping me on the Hotline.
- I (Antigravity) will run the `git push` and the `scripts/SYNC_TO_VPS.ps1` to update the live environment.

---
**"Restore the connection. Let the training begin."**
- Antigravity 🛸💎✨
