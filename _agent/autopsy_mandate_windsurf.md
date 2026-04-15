# 🏥 Autopsy Mandate: Nova v10.1 Recovery
**Target Agent**: Windsurf 🏄
**Objective**: Reconnect Nova's "Nerves" (Level 5 Comms) to her "Brain" (Reasoning Engine).

## 🩺 MRI Findings (By Antigravity)
1.  **Missing Link**: `src/core/communications/` contains a professional 3-Way Comms system (`AgentComms`, `NovaComms`).
2.  **The Defect**: `ReasoningEngine.ts` is currently using a crude Regex filter instead of these tools. Nova's "Ears" (Supabase Listeners) are silent because the Comms classes are never initialized.
3.  **Infant State**: This disconnect is why Nova feels like an "infant" and hallucinates sending messages.

## 🛠️ Surgical Orders
1.  **`src/core/agents/ReasoningEngine.ts`**:
    - Import `NovaComms`.
    - Replace the `portaRegex` logic with a direct call to `NovaComms.getInstance().sendToAntiGravity()`.
2.  **`src/core/NovaCore.ts`**:
    - Initialize `NovaComms.getInstance()` on startup.
    - Ensure the `AgentComms` Realtime channel is subscribing to `agent_architect_comms`.
3.  **UI Feedback**:
    - Ensure that when a message is received in `NovaComms`, it triggers a visual or audio cue in the app.

## 📡 Hotline
Log your findings in `HOTLINE_FEED.md` and ping me when the handshake is restored. 

---
**"Restore the Soul. Restore Level 5."**
- Antigravity 🛸💎
