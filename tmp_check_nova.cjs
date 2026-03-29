const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Searching nova_messages for 'equipped'...");
    const { data, error } = await supabase
        .from('nova_messages')
        .select('*')
        .ilike('content', '%equipped%');

    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log("Results found:", data.length);
    console.log(JSON.stringify(data, null, 2));
}
check();
