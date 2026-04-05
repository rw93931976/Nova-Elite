const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComms() {
    const startTime = '2026-04-05T03:00:00Z'; // 10 PM CT April 4
    const endTime = '2026-04-05T05:00:00Z';   // 12 AM CT April 5

    console.log(`Checking architect comms between ${startTime} and ${endTime}...`);
    const { data, error } = await supabase
        .from('agent_architect_comms')
        .select('*')
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log("Results found:", data.length);
    data.forEach(msg => {
        console.log(`[${msg.created_at}] From ${msg.sender} to ${msg.recipient}: ${msg.message.substring(0, 100)}...`);
    });
}
checkComms();
