const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    const startTime = '2026-04-05T03:15:00Z'; // 10:15 PM CT
    const endTime = '2026-04-05T03:45:00Z';   // 10:45 PM CT

    console.log(`Checking RELAY JOBS between ${startTime} and ${endTime}...`);
    const { data, error } = await supabase
        .from('relay_jobs')
        .select('*')
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log("Jobs found:", data.length);
    data.forEach(job => {
        console.log(`[${job.created_at}] Type: ${job.type} Status: ${job.status} Payload: ${JSON.stringify(job.payload).substring(0, 100)}...`);
    });
}
checkJobs();
