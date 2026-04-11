# 🛠️ Technical Diagnostic: The 1006/1008 Closure

## 🕒 Current State
As of April 8, 2026, the connection to the Sovereign Gateway succeeds, but Google drops the stream immediately after the `setup` message.

## ✅ Verified Working
- **Nginx**: Correctly upgrading WebSocket connections and routing to Port 3506 (which maps to the relay).
- **Core Dependencies**: `express` and `ws` are confirmed installed in `/root/nova-deploy/`.
- **Logic**: Both Browser and VPS are now using the correct **camelCase** schema for `generationConfig` and `responseModalities`.

## ❓ The Mystery
Why does Google close the session with 1006?
- **Hypothesis A**: The `v1alpha` endpoint is still rejecting the VPS IP despite our syntax fixes.
- **Hypothesis B**: The `systemInstruction` text might be too large or contain characters that trigger an immediate filter-close.
- **Hypothesis C**: The 1007 error was fixed, but there is a secondary field mismatch in `realtimeInput` (Base64 chunking).

## 🚀 Recovery Commands (Run on VPS)
To restart the entire bridge:
```bash
cd /root/nova-deploy
pm2 restart all
pm2 logs core --lines 50
```

To check for raw Google errors:
```bash
cat /root/nova-deploy/bridge.log
```
