import { supabase } from '../../integrations/supabase';

/**
 * SchoolingAgent: Stage 6 Autonomous Research Manager
 * ---------------------------------------------------
 * Manages the "Schooling" cycles where Nova masters specific subjects.
 * Uses the Supabase Relay to avoid node-only imports in the browser.
 */
export class SchoolingAgent {
    constructor() { }

    /**
     * Archive research content to the specific subject notebook in NotebookLM.
     * Queues a job for the VPS/Desktop Bridge to handle.
     */
    public async archiveToNotebook(subject: string, content: string): Promise<any> {
        console.log(`📚 [SchoolingAgent] Queuing archival job: ${subject}`);

        const { data: job, error } = await supabase
            .from('relay_jobs')
            .insert({
                type: 'notebook_archive',
                payload: { subject, content },
                status: 'pending'
            })
            .select('id')
            .single();

        if (error) throw error;

        return {
            success: true,
            job_id: job.id,
            subject,
            filename: `nova-data/research/studies/${subject.toLowerCase().replace(/\s+/g, '_')}.md`
        };
    }
}
