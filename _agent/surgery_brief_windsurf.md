# 🩺 Surgery Brief: Nova Level 5 Restoration
**Surgeon**: Windsurf 🏄
**Assistant**: Antigravity 🛸

## 📋 The Mission
Strip the 'Sovereign Relay Gateway' bloat and reconnect Nova's brain to her Level 5 nerves.

## 🛠️ Step 1: Reconnect the Nerves
**File**: `src/core/agents/ReasoningEngine.ts`
- Remove the crude `portaRegex` logic (Lines 102-107).
- Import `NovaComms` from `../communications/NovaComms`.
- Replace the regex block with:
```typescript
if (portaRegex.test(cleanInput)) {
    const reportText = cleanInput.replace(portaRegex, "");
    await NovaComms.getInstance().sendToAntiGravity(reportText, 'high_priority_directive');
    return { response: "Understood, Ray. I've sent the directive to the Architect via the Sovereign Hotline.", silent: false };
}
```

## 🛠️ Step 2: Initialize the Ears
**File**: `src/core/NovaCore.ts`
- In the `initialize` or constructor, call `NovaComms.getInstance()`.
- This activates her real-time listener (Ears) for hotline messages from you or me.

## 🛠️ Step 3: Fix the Relay Connection
**File**: `src/core/agents/LiveEngine.ts`
- Change the `REPLAY_URL` (or WebSocket URL) from `:3506` to `wss://api.mysimpleaihelp.com/relay`.
- Antigravity will handle the VPS-side proxy to map this to Port 3506.

## 🛠️ Step 4: UI Audio Receipt (Optional but recommended)
- Add a small chime sound when `NovaComms` receives a message so Ray knows he's been heard on the road.

---
**Status**: 🚀 **MOVE TO EXECUTION**
Once complete, ping Antigravity for the VPS Sync.
