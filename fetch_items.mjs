import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const raw = fs.readFileSync('.env', 'utf8');
const env = {};
raw.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('nova_schooling_mastery').select('subject_name');
if (error) {
    console.error("Error:", error);
} else {
    const names = data.map(n => n.subject_name).sort();
    console.log("Count:", names.length);
    let out = '# 90-Subject Syllabus\n\n';
    names.forEach(n => out += `- ${n}\n`);
    fs.writeFileSync('90-subject-syllabus.md', out);
    console.log("Written to 90-subject-syllabus.md");
}
