const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractContent() {
    const startTime = '2026-04-05T03:15:00Z'; // 10:15 PM CT
    const endTime = '2026-04-05T03:45:00Z';   // 10:45 PM CT

    console.log(`Extracting content between ${startTime} and ${endTime}...`);
    const { data, error } = await supabase
        .from('nova_messages')
        .select('*')
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    data.forEach(msg => {
        console.log(`\n[${msg.created_at}] ${msg.role.toUpperCase()}:`);
        console.log(msg.content);
        console.log("-".repeat(20));
    });
}
extractContent();
