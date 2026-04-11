# 🔄 Operational Recovery Guide

If you lose connection or need to reset the sandbox:

## 1. Local Reset
Run these to ensure your local React environment is clean:
```powershell
npm run dev
```
(Check Port 3111 or the vite allocated port).

## 2. Remote Reset (VPS)
SSH in and check that the processes haven't crashed:
```bash
pm2 list
pm2 restart all
```

## 3. The "Last Resort" IP Bypass
If the Sovereign Relay (VPS) continues to be blocked by Google, you can switch `LiveEngine.ts` back to **Direct Mode** (using the Browser's IP) by changing the `relayUrl` to the Google WebSocket URL directly. 
*Note: This exposes the API Key in the browser source.*
