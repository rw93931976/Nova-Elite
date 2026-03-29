const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRxZmdibnd6c3ZlZW11eXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg3NDUzOSwiZXhwIjoyMDg1NDUwNTM5fQ.e_W6mF8_X9I_-I9I_S_O_A_O_A_O_A_O_A_O_A_O_A_O_A_O_A_O_A_O_A_O';
const supabase = createClient(supabaseUrl, supabaseKey);

const transcriptPath = 'C:\\Users\\Ray\\.gemini\\antigravity\\brain\\1ebc5bad-1b4f-484e-86bd-673e60e24fd5\\browser\\scratchpad_aj9q0yzp.md';

async function syncTranscript() {
    console.log("🚀 Syncing 2-hour Masterclass Transcript with Granular Indexing...");

    if (!fs.existsSync(transcriptPath)) {
        console.error("❌ Transcript file not found.");
        return;
    }

    const content = fs.readFileSync(transcriptPath, 'utf8');

    // Chunking by approx 1000 characters to ensure distinct RAG context
    const chunkSize = 1500;
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.substring(i, i + chunkSize));
    }

    console.log(`Split into ${chunks.length} granular segments.`);

    for (let i = 0; i < chunks.length; i++) {
        const { error } = await supabase
            .from('nova_self_knowledge')
            .upsert({
                title: `Masterclass Part ${i + 1}`,
                content: chunks[i],
                category: 'masterclass_primary_source',
                importance: 10
            }, { onConflict: 'title' });

        if (error) console.error(`Error on chunk ${i + 1}:`, error.message);
        else process.stdout.write('.');
    }

    console.log("\n✨ Masterclass Indexed for High-Precision Retrieval.");
}

syncTranscript();
