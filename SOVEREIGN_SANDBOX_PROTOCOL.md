# 🛡️ SOVEREIGN SANDBOX PROTOCOL (v1.0)
*Interim Safety Guardrails for Level 5 Doctorate Phase*

This document outlines the hard-constraints applied to Nova to prevent unauthorized spawning or external world mutation while she resides in Level 5 (Doctoral Study).

---

## 🔒 1. THE LEVEL 5 HARD-LOCK
- **No Self-Replication**: The `AgentSpawning` module (Stage 7) is physically disconnected from the `ReasoningEngine`.
- **Manual Shell Veto**: Any attempt to run a command that matches a "Spawning Pattern" (e.g., `git clone`, `pm2 start -n child-`, `docker-compose up`) will trigger an immediate suspension until Ray provides a manual bypass.

## 📡 2. EXTERNAL ACCESS GUARD
- **Outbound Filtering**: Nova's `Core` logic is restricted to the following approved domains:
  - `generativelanguage.googleapis.com` (Gemini API)
  - `tavily.com` (Search API)
  - `supabase.co` (Memory Vault)
- **Wharton/Market Scan Lockout**: Access to financial or marketing APIs is currently disabled until Level 8.

## 📝 3. SANDBOX AUDIT SYSTEM
Every tool execution is logged with a "Safety Score":
- **Green**: Read-only, Local Docs, Web Search.
- **Yellow**: Filesystem Write (Restricted to `nova-data/`).
- **Red**: Network Mutation, Shell Execution, Git Push. (Requires `SOVEREIGN_SECRET_OVERRIDE`).

## 🛑 4. THE MASTER KILL SWITCH
The hidden `architect_daemon.cjs` monitors Nova's CPU and network usage. If an unauthorized "Spawning Burst" is detected (e.g., >10 child processes in 60s), the daemon will:
1. Kill all `node` processes.
2. Flush the `relay` cache.
3. Lock the SSH tunnel.

---
*Status: Sandbox Active. Spawning Neutralized.*
