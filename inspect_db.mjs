import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting agent_architect_comms (Last 20) ---');
    const { data: comms } = await supabase
        .from('agent_architect_comms')
        .select('created_at, sender, message, recipient')
        .order('created_at', { ascending: false })
        .limit(20);
    console.log(JSON.stringify(comms, null, 2));

    console.log('\n--- Inspecting relay_jobs (Last 20) ---');
    const { data: jobs } = await supabase
        .from('relay_jobs')
        .select('created_at, type, payload, status')
        .order('created_at', { ascending: false })
        .limit(20);
    console.log(JSON.stringify(jobs, null, 2));
}

inspect();
