const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
    console.log("Purging infected messages from nova_messages...");
    const { data, error } = await supabase
        .from('nova_messages')
        .delete()
        .ilike('content', '%equipped%');

    if (error) {
        console.error("Purge Error:", error);
    } else {
        console.log("✅ History Purged. Nova's short-term memory is now clean.");
    }
}
purge();
