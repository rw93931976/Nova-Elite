require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('nova_schooling_mastery').select('subject_name');
    if (error) {
        console.error("Error:", error);
        return;
    }
    const names = data.map(n => n.subject_name).sort();
    console.log("Count:", names.length);
    fs.writeFileSync('output_subjects.json', JSON.stringify(names, null, 2));
}

run();
