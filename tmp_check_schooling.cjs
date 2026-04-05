const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchooling() {
    console.log("Checking for Schooling Evidence...");

    // 1. Check nova_memories for 'notebooks' or 'schooling'
    const { data: memories } = await supabase
        .from('nova_memories')
        .select('*')
        .or('category.eq.knowledge_atlas,category.eq.notebook_registry,category.eq.emotion_atlas')
        .order('updated_at', { ascending: false });

    console.log("\n--- MEMORIES ---");
    memories?.forEach(m => {
        console.log(`[${m.updated_at}] Category: ${m.category} | Preview: ${m.content.substring(0, 100)}...`);
    });

    // 2. Check for recent 'notebook' relay jobs
    const { data: jobs } = await supabase
        .from('relay_jobs')
        .select('*')
        .eq('type', 'notebook')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log("\n--- NOTEBOOK JOBS ---");
    jobs?.forEach(j => {
        console.log(`[${j.created_at}] Status: ${j.status} | Payload: ${JSON.stringify(j.payload)}`);
    });
}
checkSchooling();
