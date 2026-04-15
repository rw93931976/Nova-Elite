import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
    console.log('🚀 [Purge] Starting v8.9.9.10 Deep Purge...');

    // 1. Purge relay_jobs of junk speech
    const { error: err1 } = await supabase
        .from('relay_jobs')
        .delete()
        .eq('status', 'pending')
        .or('payload->>text.ilike.%v8.9.9%,payload->>text.ilike.%heartbeat%,payload->>text.ilike.%robotic%,payload->>text.ilike.%uptime%');

    if (err1) console.error('Error purging relay_jobs:', err1);
    else console.log('✅ [Relay] Pending junk speech purged.');

    // 2. Purge agent_architect_comms of any remaining vps_heartbeat
    const { error: err2 } = await supabase
        .from('agent_architect_comms')
        .delete()
        .or('sender.eq.vps_heartbeat,message.ilike.%PULSE%,message.ilike.%Uptime%');

    if (err2) console.error('Error purging architect comms:', err2);
    else console.log('✅ [Comms] Pulse messages purged.');

    // 3. Mark all unread nova messages as read to stop the backlog
    const { error: err3 } = await supabase
        .from('agent_architect_comms')
        .update({ status: 'read' })
        .eq('recipient', 'nova')
        .eq('status', 'unread');

    if (err3) console.error('Error marking as read:', err3);
    else console.log('✅ [Comms] Backlog silenced.');
}

purge();
