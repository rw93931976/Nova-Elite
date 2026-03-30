import { supabase } from '../../integrations/supabase';

export class BackupAgent {
    constructor() {
        console.log("🛡️ [BackupAgent] Initialized for Stage 6: Tool Genesis.");
    }

    /**
     * Triggers an autonomous backup pulse.
     */
    public async triggerBackup(): Promise<{ success: boolean; message: string }> {
        console.log("🎬 [BackupAgent] Initiating Autonomous Backup Pulse...");

        try {
            // 1. Queue a RELAY_JOB for the local bridge
            const { data, error } = await supabase
                .from('relay_jobs')
                .insert([{
                    type: 'backup',
                    status: 'pending',
                    payload: {
                        timestamp: new Date().toISOString(),
                        include_storage: true,
                        db_url: import.meta.env.VITE_SUPABASE_URL
                    }
                }])
                .select();

            if (error) throw error;

            return {
                success: true,
                message: `Backup job queued (ID: ${data[0].id}). Awaiting bridge execution.`
            };
        } catch (e: any) {
            console.error("❌ [BackupAgent] Pulse failed:", e.message);
            return { success: false, message: e.message };
        }
    }

    /**
     * Checks the status of the last backup.
     */
    public async getLatestStatus(): Promise<any> {
        const { data } = await supabase
            .from('relay_jobs')
            .select('*')
            .eq('type', 'backup')
            .order('created_at', { ascending: false })
            .limit(1);

        return data?.[0] || null;
    }
}
