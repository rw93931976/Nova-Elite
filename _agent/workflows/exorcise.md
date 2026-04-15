---
description: how to perform a deep system purge (Exorcism)
---

# Exorcism Protocol (v9.7.1)

Use this workflow when the Nova-Elite bridge or frontend is trapped in a port conflict or "ghost" loop.

1.  Run the exorcism script:
```bash
powershell -ExecutionPolicy Bypass -File scripts\exorcise.ps1
```

2.  Restart the ecosystem:
```bash
npx pm2 start ecosystem.config.cjs
```

3.  Verify status:
```bash
npx pm2 list
```
