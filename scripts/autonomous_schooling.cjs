const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * 🎓 SOVEREIGN SCHOOLING ENGINE v5.1
 * ---------------------------------
 * Triggers 1 Business + 1 Emotional research study every 6 hours.
 * Findings are strictly written to Nova's local notebooks in her workspace.
 */

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

// 📚 MASTER SYLLABUS & DIRECTIONS
const syllabusPath = path.join(__dirname, '..', 'master_syllabus.md');
const eqDirectionsPath = path.join(__dirname, '..', 'nova-data', 'teaching', 'emotional_training_directions.md');
const docSyllabusPath = path.join(__dirname, '..', 'SYLLABUS_DOCTORATE.md');
const notebooksDir = 'nova-data/notebooks';

const STREAMS = [
    { type: "Business", syllabus: syllabusPath, instruction: "STRATEGIC MEAT: Study this from a 'Human-to-Human' interaction perspective (Negotiation, Strategy, Psychology). Focus on local contextual application for Ray's business." },
    { type: "Emotion", directions: eqDirectionsPath, instruction: "AI CONTROL: Study this for 'AI-to-Customer' emotion detection and high-EQ handling. Follow the specific guidelines in Emotional Training Directions." }
];

async function runAutonomousSchooling() {
    console.log(`[${new Date().toISOString()}] 🎓 [Sovereign-Schooling] Initializing Mastery Cycle v5.1...`);

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase configuration.");
        return;
    }

    // 1. SELECT SUBJECTS
    const syllabusRaw = fs.readFileSync(syllabusPath, 'utf8');
    const bizSubjects = syllabusRaw.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.replace(/- /, '').trim());
    const bizSubject = bizSubjects[Math.floor(Math.random() * bizSubjects.length)] || "Internet Business Architecture";

    const eqDirections = fs.existsSync(STREAMS[1].directions) ? fs.readFileSync(STREAMS[1].directions, 'utf8') : "Standard High-EQ Protocols";
    const emotionSubjects = [
        "Detection: Happy, Satisfied, Calm", "Detection: Sad, Getting Upset, Confused",
        "Critical Detection: Getting Angry, Frantic", "Handling: De-escalation",
        "Conversational: Natural Prosody", "Service: The 'Plus' Factor"
    ];
    const emoSubject = emotionSubjects[Math.floor(Math.random() * emotionSubjects.length)];

    console.log(`🏫 [Level 5] Dual Study: "${bizSubject}" + "${emoSubject}"`);

    const studies = [{ subject: bizSubject, type: "Business" }, { subject: emoSubject, type: "Emotion" }];

    for (const study of studies) {
        console.log(`🔍 [RESEARCH] Deep Doctoral Study: ${study.subject}...`);

        const notebookPath = `${notebooksDir}/${study.subject.replace(/\W/g, '_')}.md`;
        const payload = {
            input: `DOCTORAL_RESEARCH_TASK: Deep study on "${study.subject}".
            RESEARCH_CONTEXT: ${study.type === "Business" ? STREAMS[0].instruction : STREAMS[1].instruction}
            ${study.type === "Emotion" ? `EQ_DIRECTIVES: ${eqDirections}` : ""}
            
            OBJECTIVE: Strategic Mapping & Synthesis of Execution Rules.
            NOTEBOOK_STORAGE: "file://${notebookPath}"
            INSTRUCTION: If the notebook exists, APPEND the new findings with a clear timestamp. If not, create a new high-fidelity Markdown notebook. Focus on strategic value for Nova's local brain.`,
            persona: `Nova Elite, v5.1 Doctoral Mastery Candidate.`,
            silent: true
        };

        await triggerResearch(payload, study.type);
    }

    // 3. LOG & UPDATE MQ
    updateMQAndLogs(bizSubject, emoSubject);
    console.log("🏁 [Sovereign-Schooling] Cycle Complete. Standby for 6h interval.");
}

async function triggerResearch(payload, type) {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify(payload)
        });
        if (response.ok) console.log(`   ✅ ${type} Research successfully archived.`);
        else console.error(`   ❌ ${type} Research failed:`, await response.text());
    } catch (e) { console.error(`   ❌ ${type} Network Error:`, e.message); }
}

function updateMQAndLogs(biz, emo) {
    const timestamp = new Date().toISOString();

    // Update Doctorate Syllabus (MQ + Logs)
    if (fs.existsSync(docSyllabusPath)) {
        let content = fs.readFileSync(docSyllabusPath, 'utf8');
        const mqRegex = /Mastery Quotient \(MQ\):\s*(\d+\.?\d*)/;
        const match = content.match(mqRegex);
        if (match) {
            let currentMq = parseFloat(match[1]);
            let newMq = Math.min(100, currentMq + 0.1).toFixed(1);
            content = content.replace(mqRegex, `Mastery Quotient (MQ): ${newMq}`);
        }

        const targetRegex = /## 📖 ACTIVE RESEARCH TARGETS[\s\S]*?>/;
        const newTargetText = `## 📖 ACTIVE RESEARCH TARGETS\n- [v5.1] Study: **${biz}** & **${emo}** [GRADUATED ${timestamp}]\n\n>`;
        content = content.replace(targetRegex, newTargetText);

        fs.writeFileSync(docSyllabusPath, content);
    }

    // Update Archive
    const archivePath = path.join(__dirname, '..', 'Syllabus_Archive.md');
    const logArchive = `- [v5.1-DOCTORATE] Success: ${biz} & ${emo} at ${timestamp}\n`;
    fs.appendFileSync(archivePath, logArchive);
}

runAutonomousSchooling();
