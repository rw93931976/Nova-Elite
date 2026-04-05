const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificWindow() {
    const startTime = '2026-04-05T03:15:00Z'; // 10:15 PM CT
    const endTime = '2026-04-05T03:45:00Z';   // 10:45 PM CT

    console.log(`Checking SPECIFIC WINDOW between ${startTime} and ${endTime}...`);

    // 1. Nova Messages
    const { data: messages } = await supabase
        .from('nova_messages')
        .select('*')
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: true });

    console.log(`\n--- NOVA MESSAGES (${messages?.length || 0}) ---`);
    messages?.forEach(msg => {
        console.log(`[${msg.created_at}] ${msg.role}: ${msg.content.substring(0, 150)}`);
    });

    // 2. Architect Comms (Communication from Nova to ME)
    const { data: comms } = await supabase
        .from('agent_architect_comms')
        .select('*')
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: true });

    console.log(`\n--- ARCHITECT COMMS (${comms?.length || 0}) ---`);
    comms?.forEach(c => {
        console.log(`[${c.created_at}] From ${c.sender} to ${c.recipient}: ${c.message}`);
    });
}
checkSpecificWindow();
