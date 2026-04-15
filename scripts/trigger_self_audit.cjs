const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function triggerSelfAudit() {
    console.log('🧠 [Sovereign Audit] Initiating Nova Elite Self-Audit...');

    const prompt = `
Nova, you are in v3.5.9-RECOVERY. It is time for your first Sovereign Self-Audit. 

GOALS:
1. **Memory Continuity**: Reference 'C:/Users/Ray/Documents/Nova_Elite_Memory_Export.md' to bridge the pre-crash gap.
2. **Infrastructure Check**: Confirm your VPS Bridge and NotebookLM tools are functional.
3. **Library Archival**: Create or update your 'Sovereign-Audit' notebook.
4. **User Knowledge**: Ensure you have a 'User-Knowledge' notebook about Ray's preferences and business history.
5. **Supabase Optimization**: Acknowledge that all long-term storage is moved to NotebookLM to save Supabase resources.

Perform this audit now and archive your report in your Sovereign Library.
    `.trim();

    // Trigger the brain via a task or a direct job if supported.
    // Here we'll queue a research-style job that the bridge handles.
    const { error } = await supabase.from('relay_jobs').insert({
        type: 'notebook_add_source',
        payload: {
            content: prompt,
            notebookId: 'sovereign-audit'
        },
        status: 'pending'
    });

    if (error) {
        console.error('❌ Failed to trigger audit:', error);
    } else {
        console.log('✅ Audit job queued. Nova will begin her reflection shortly.');
    }
}

triggerSelfAudit();
