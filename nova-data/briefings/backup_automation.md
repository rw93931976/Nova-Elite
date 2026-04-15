# 🛡️ SOVEREIGN BRIEFING: Backup Automation (Stage 6)

## Overview
To ensure total autonomy, Nova requires a self-managed backup system that doesn't rely solely on platform-provided snapshots. This briefing outlines the transition to Stage 6: Tool Genesis for the Backup module.

## Strategy
1. **Database Snapshots**: Use `supabase db dump` to create unencrypted SQL files.
2. **Local Storage Sync**: Download storage buckets via the Supabase Client API and store them in a timestamped local folder.
3. **Orchestration**:
    - `BackupAgent.ts` (Core): Logic to determine *when* to backup based on system activity.
    - `vps-core-sovereign-native.cjs` (Bridge): The executioner that runs the shell commands.
    - `relay_jobs` (Hub): The communication channel.

## Action Plan
- [ ] Create `src/core/agents/BackupAgent.ts`.
- [ ] Implement `BACKUP` job type in the local bridge.
- [ ] Add "Last Backup" status to the Nova Dashboard.

## Research Findings
- Supabase CLI is the most reliable way to dump the schema and data locally.
- Point-in-Time Recovery (PITR) is enabled on the cloud, but local backups provide a "break glass" recovery path if the cloud account is compromised.
