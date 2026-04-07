const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 🛠️ CONFIG: Load environment from root .env
const envPath = path.join(__dirname, '..', '.env');
const envContentRaw = fs.readFileSync(envPath, 'utf8');
const env = {};
envContentRaw.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

// 📚 MASTER SYLLABUS: Parse subjects from master_syllabus.md
const syllabusPath = path.join(__dirname, '..', 'master_syllabus.md');
const syllabusRaw = fs.readFileSync(syllabusPath, 'utf8');
const allSubjects = syllabusRaw.split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.replace(/- /, '').trim());

// 🎭 EMOTIONAL SPECTRUM & NATURAL FLOW (Grade 9.7)
const emotionSubjects = [
    "Detection: Happy, Satisfied, Calm",
    "Detection: Sad, Getting Upset, Confused",
    "Critical Detection: Getting Angry, Frantic",
    "Handling: De-escalation of Anger & Frantic Calls",
    "Handling: Sincere Response to Sadness & Confusion",
    "Conversational: Natural Prosody & Pacing (Human-Mimicry)",
    "Conversational: Managing Upfront Disclaimers in Natural Flow",
    "Architecture: Designing High-EQ Sub-Agent Personas",
    "Service: Exceeding Human Performance (The 'Plus' Factor)"
];

async function runAutonomousSchooling() {
    console.log(`[${new Date().toISOString()}] 🎓 [Sovereign-Schooling] Initializing Mastery Cycle...`);

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase configuration.");
        return;
    }

    // 1. SELECT SUBJECTS (1 Business + 1 Emotion)
    const bizSubject = allSubjects.length > 0
        ? allSubjects[Math.floor(Math.random() * allSubjects.length)]
        : "Internet Business Architecture";

    const emoSubject = emotionSubjects[Math.floor(Math.random() * emotionSubjects.length)];

    console.log(`🏫 [Level 5] Dual Study: "${bizSubject}" + "${emoSubject}"`);

    // 2. TRIGGER STUDIES (Research via Sovereign Brain)
    // The Brain will perform the research AND use the 'write_notebook' tool 
    // to save it back to the VPS filesystem.
    const studies = [
        { subject: bizSubject, type: "Business" },
        { subject: emoSubject, type: "Emotion" }
    ];

    for (const study of studies) {
        console.log(`🔍 Researching ${study.type}: ${study.subject}...`);

        const isBusiness = study.type === "Business";
        const payload = {
            input: `SOVEREIGN_RESEARCH_PROTOCOL: Deep doctoral study on "${study.subject}". 
            - ${isBusiness ? "STRATEGIC MEAT: Study this from a 'Human-to-Human' interaction perspective (Negotiation, Strategy, Psychology)." : "AI CONTROL: Study this for 'AI-to-Customer' emotion detection and high-EQ handling."}
            - Extract execution patterns and strategic rules.
            - Focus on local contextual application for Ray's business (SMB to Enterprise).
            - For Business studies, analyze as if performing a peer-level strategic audit.
            - WRITE findings to: "file://nova-data/notebooks/${study.subject.replace(/\W/g, '_')}.md".`,
            persona: `You are Nova Elite, performing an Autonomous Research Study. You are a doctoral-level peer for Ray. Professional, sharp, and strategic.`,
            silent: true
        };

        try {
            // Use standard fetch (Node 18+) or axios if installed. Bridge uses axios.
            const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`✅ ${study.type} Study archived to VPS Context.`);
                // Note: The Edge function handles embedding to Supabase automatically.
            } else {
                console.error(`❌ ${study.type} Study failed:`, await response.text());
            }
        } catch (e) {
            console.error(`❌ ${study.type} Network Error:`, e.message);
        }
    }

    // 3. LOG COMPLETION
    const timestamp = new Date().toISOString();

    // Update Doctorate Syllabus
    const docSyllabusPath = path.join(__dirname, '..', 'SYLLABUS_DOCTORATE.md');
    const logSyllabus = `- [v9.6-MASTERS] Success: ${bizSubject} & ${emoSubject} archived at ${timestamp}\n`;
    fs.appendFileSync(docSyllabusPath, logSyllabus);

    // Update Solutions Vault
    const vaultPath = path.join(__dirname, '..', 'nova-data', 'library', 'solutions_vault.md');
    const logVault = `\n- [Schooling] Mastery Cycle completed for "${bizSubject}" on ${timestamp}`;
    if (fs.existsSync(vaultPath)) fs.appendFileSync(vaultPath, logVault);

    console.log("🏁 [Sovereign-Schooling] Cycle Complete. Standby for 6h interval.");
}

runAutonomousSchooling();
