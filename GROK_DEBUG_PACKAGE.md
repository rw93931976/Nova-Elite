# Nova Dual-Bridge System - Windows Networking Issue

## Problem Summary
Nova dual-bridge routing is implemented and VPS bridge works perfectly, but Windows networking blocks all local servers. Even simple Node.js test servers won't bind to ports.

## What Works
- VPS bridge running on 31.220.59.237:3008 (fully functional)
- Dual-bridge routing logic in ReasoningEngine.ts
- Frontend properly configured for both bridges

## What's Broken
- Windows Node.js servers say "running on port X" but ports don't actually bind
- netstat shows no ports listening
- curl requests to localhost fail silently
- Affects both NovaSuperBridge.cjs and simple test servers

## Key Files
- ReasoningEngine.ts (dual-bridge routing)
- useNova.ts (frontend bridge URLs)
- NovaSuperBridge.cjs (VPS bridge - working)
- test_server.cjs (minimal server that won't bind)

## Question for GROK
Why won't Node.js servers bind to ports on Windows? The servers start successfully and claim to be listening, but netstat shows no ports bound and curl requests fail. This affects all Node.js servers, not just Nova.

## Test Results
- netstat -an | findstr :3000 → No output
- curl -s http://localhost:3000/health → No response
- Multiple ports tested (3000, 3001, 3002) - same issue
- Both 127.0.0.1 and 0.0.0.0 bindings tested

## Environment
- Windows 11
- Node.js v24.7.0
- Project uses ES modules ("type": "module" in package.json)
- Using .cjs extension for CommonJS files
