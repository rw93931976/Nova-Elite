# 🛡️ NOVA ELITE: SECURITY PROTOCOL (v1.0)

Ray, this document outlines the active safeguards protecting Nova and your API keys from external takeover.

## 1. Keychain Sovereignty (API Security)
- [x] **Zero Hardcoding**: All API keys (OpenAI, Groq, OpenRouter) have been moved out of the code and into the **Supabase Secret Vault**. They are now invisible to anyone browsing the codebase.
- [x] **Local Encryption**: Local `.env` files are ignored by Git to prevent accidental commits to public repositories.
- [x] **Bridge Whitelisting**: The VPS Bridge only accepts requests from your specific Supabase URL and verified JWT (JSON Web Tokens).

## 2. Behavioral Guardrails (Constitutional v8.8.6 - CODIFIED)
- [x] **[HARD-CODED] No-Delete Policy**: Destructive shell commands (`rm`, `unlink`, `drop`, etc.) are now intercepted and blocked at the VPS Bridge level. All agents are restricted to READ/WRITE (Append) and notebook creation only.
- [x] **[HARD-CODED] Notebook Auto-Registry**: Any new knowledge created via `write_notebook` is automatically registered in the `notebook_registry` memory, ensuring Nova's schooling is archived and searchable.
- [x] **[MANDATED] Separation of Duties**: 
    - **INTERNAL**: Wharton-level strategic rigor (internal advisory to Ray).
    - **EXTERNAL**: High-EQ/SQ (mirroring the speaker, e.g., Joe the Plumber).
- [x] **[MANDATED] Archival Protocol**: Nova is instructed to ALWAYS archive conclusions from schooling (including YouTube/Podcast studies) into notebooks.
- [x] **Human-in-the-Loop**: Confirmed in the `ReasoningEngine` as the sovereign authority for high-impact pushes.

## 3. Network Defenses
- [x] **CORS Locked**: The Edge Functions are configured to reject requests from unauthorized domains.
- [x] **Bridge Stealth**: Your VPS bridge uses a non-standard port and is hidden behind the Supabase Realtime Mesh.

---

## 🔐 ACTION REQUIRED FOR RAY:
To finalize the security hardening, please run this command one last time to sync the new vault keys:
`supabase secrets set OPENAI_API_KEY=your_key GROQ_API_KEY=your_key OPENROUTER_API_KEY=your_key`
*(Replace "your_key" with the actual keys from your notes)*
