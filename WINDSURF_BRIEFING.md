# Sovereign Elite v3.0: Windsurf Agent Briefing

## 📡 CURRENT SYSTEM MANIFEST
- **Corpus**: Nova-Elite (Vite + React + Supabase + PWA)
- **Resident Status**: Port 39922 (Windows Bridge / "Inside Man")
- **Brain**: Supabase Edge Function (`sovereign-brain`)
- **Vocal Logic**: Universal Voice Sync (Double-Echo: Phone -> Supabase -> Bridge -> PC)
- **Stage**: 11 (Emotion / Tone Matching / Scribe Autonomy)

## 🛠️ CRITICAL ARCHITECTURE
- **The Bridge**: `vps-core-sovereign-native.cjs` runs a local Express server on Port 39922. It polls Supabase for `relay_jobs` and executes local file writes/speech.
- **Relay Mechanism**: All assistant responses are inserted into the `relay_jobs` table by the frontend (`useNova.ts`).
- **Autonomy**: Nova acts as a Level 5 Sovereign Partner. Minimal greetings, focus on research and execution.

## 🚀 WINDSURF AGENT INSTRUCTIONS
- **Port Management**: Always ensure `vps-core-sovereign-native.cjs` is running. Use `node` to start it.
- **Vocal First**: Maintain the `useSpeech.ts` chunking and `synth.resume()` logic.
- **Security**: All API keys are in `.env`. DO NOT reveal these in logs.
- **Vercel**: Deployments are to the `main` branch.

## ⚠️ EXISTING BLOCKERS
1. **Mobile Browser Autoplay**: Requires a manual tap in the bottom dock to "Authorize" the speaker.
2. **Bridge Polling**: Ensure the heartbeat at Port 39922 remains alive to hear the phone commands.

**Solidified. Nova is online.**
