const { createClient } = require('@supabase/supabase-js');

// Configuration from .env
const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ1MzksImV4cCI6MjA4NTQ1MDUzOX0.di_nb9liVxcG6fjncyyH43t1UEeQAGLRegKzWC0uVak';
const supabase = createClient(supabaseUrl, supabaseKey);

const message = process.argv.slice(2).join(' ') || "Architect is stabilizing sensors and cognitive pathways.";

async function mirror() {
    console.log(`📡 [Architect Sync] Pushing to Mesh: "${message}"`);

    const { data, error } = await supabase
        .from('agent_architect_comms')
        .insert([{
            sender: 'architect',
            recipient: 'all',
            message: message,
            status: 'unread',
            priority: 'high'
        }]);

    if (error) {
        console.error("❌ Sync Failed:", error.message);
    } else {
        console.log("✅ Sync Successful. Nova is now aware.");
    }
}

mirror();
