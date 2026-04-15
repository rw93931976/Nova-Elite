require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * 🎓 SOVEREIGN SCHOOLING ENGINE v6.0 (Hardened)
 * -------------------------------------------
 * Triggers Doctoral Research cycles and syncs to both local files 
 * and Supabase Memory/Mastery tables.
 */

// 🛠️ CONFIG
const supabaseUrl = process.env['VITE_SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const notebooksDir = path.join(__dirname, '..', 'nova-data', 'notebooks');
const logFilePath = path.join(__dirname, '..', 'nova-data', 'schooling.log');
const syllabusPath = path.join(__dirname, '..', 'master_syllabus.md');
const eqDirectionsPath = path.join(__dirname, '..', 'nova-data', 'teaching', 'emotional_training_directions.md');
const docSyllabusPath = path.join(__dirname, '..', 'SYLLABUS_DOCTORATE.md');
const archivePath = path.join(__dirname, '..', 'Syllabus_Archive.md');

// 📝 LOGGING HELPER
function log(msg, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level}] ${msg}`;
    console.log(formatted);
    try {
        const dir = path.dirname(logFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(logFilePath, formatted + '\n');
    } catch (e) {
        console.error("Critical: Failed to write to log file.", e.message);
    }
}

// 🚨 GLOBAL ERROR GUARDS
process.on('uncaughtException', (err) => {
    log(`FATAL: Uncaught Exception: ${err.message}`, 'ERROR');
    log(err.stack, 'DEBUG');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`FATAL: Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    process.exit(1);
});

async function runAutonomousSchooling() {
    log("🚀 Cycle starting...");

    try {
        if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration.");

        // 1. SELECT SUBJECTS
        const subjects = getSubjects();
        log(`Selected Targets: [Business: ${subjects.bizSubject}] [Emotion: ${subjects.emoSubject}]`);

        const studies = [
            { subject: subjects.bizSubject, type: "Business", instruction: "STRATEGIC MEAT: Study this from a 'Human-to-Human' interaction perspective (Negotiation, Strategy, Psychology). Focus on local contextual application for Ray's business." },
            { subject: subjects.emoSubject, type: "Emotion", instruction: "AI CONTROL: Study this for 'AI-to-Customer' emotion detection and high-EQ handling. Follow the specific guidelines in Emotional Training Directions." }
        ];

        for (const study of studies) {
            await performStudy(study);
        }

        log("🏁 Cycle Complete. Syncing logs...");
        updateMarkdownArtifacts(subjects.bizSubject, subjects.emoSubject);

    } catch (error) {
        log(`Cycle failed: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

function getSubjects() {
    let bizSubject = "Internet Business Architecture";
    if (fs.existsSync(syllabusPath)) {
        const syllabusRaw = fs.readFileSync(syllabusPath, 'utf8');
        const bizSubjects = syllabusRaw.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.replace(/- /, '').trim());
        if (bizSubjects.length > 0) bizSubject = bizSubjects[Math.floor(Math.random() * bizSubjects.length)];
    }

    const emotionSubjects = [
        "Detection: Happy, Satisfied, Calm", "Detection: Sad, Getting Upset, Confused",
        "Critical Detection: Getting Angry, Frantic", "Handling: De-escalation",
        "Conversational: Natural Prosody", "Service: The 'Plus' Factor"
    ];
    const emoSubject = emotionSubjects[Math.floor(Math.random() * emotionSubjects.length)];

    return { bizSubject, emoSubject };
}

async function performStudy(study) {
    log(`Processing Study: ${study.subject}...`);

    const notebookFilename = `${study.subject.replace(/\W/g, '_')}.md`;
    const notebookPath = path.join(notebooksDir, notebookFilename);
    const relNotebookPath = `nova-data/notebooks/${notebookFilename}`;

    const payload = {
        input: `DOCTORAL_RESEARCH_TASK: Deep study on "${study.subject}".
        RESEARCH_CONTEXT: ${study.instruction}
        ${study.type === "Emotion" && fs.existsSync(eqDirectionsPath) ? `EQ_DIRECTIVES: ${fs.readFileSync(eqDirectionsPath, 'utf8')}` : ""}
        
        OBJECTIVE: Strategic Mapping & Synthesis of Execution Rules.
        NOTEBOOK_STORAGE: "file://${relNotebookPath}"
        INSTRUCTION: If the notebook exists, APPEND the new findings with a clear timestamp. If not, create a new high-fidelity Markdown notebook.`,
        persona: `Nova Elite, v6.0 Doctoral Mastery Candidate.`,
        silent: true
    };

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Edge Function Error (${response.status}): ${errBody}`);
        }

        const result = await response.json();
        const content = result.response || result.text || "";

        if (!content) throw new Error("Received empty content from research engine.");

        // Archive to File
        archiveToFile(notebookPath, study.subject, content);

        // Sync to Database
        await syncToDatabase(study, content, relNotebookPath);

        log(`Successfully completed ${study.type} study on ${study.subject}`);

    } catch (e) {
        log(`Study failed (${study.subject}): ${e.message}`, 'ERROR');
        // We don't exit here, we try the next study
    }
}

function archiveToFile(filePath, subject, content) {
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const noteEntry = `\n\n### 🎓 DOCTORAL STUDY [${timestamp}]\n**Subject**: ${subject}\n\n${content}\n\n---`;
    fs.appendFileSync(filePath, noteEntry);
}

async function syncToDatabase(study, content, notebookUrl) {
    // 1. Record Memory
    const { error: memErr } = await supabase.from('nova_memories').insert({
        category: study.type.toLowerCase(),
        content: `DOCTORAL STUDY: I have completed a deep study on "${study.subject}". Key findings: ${content.substring(0, 500)}...`,
        importance: 4,
        metadata: { subject: study.subject, notebook: notebookUrl, version: "6.0" }
    });
    if (memErr) log(`Memory Sync Err: ${memErr.message}`, 'WARNING');

    // 2. Update Mastery
    const { error: masteryErr } = await supabase.from('nova_schooling_mastery').upsert({
        subject_name: study.subject,
        last_studied_at: new Date().toISOString(),
        notebook_url: notebookUrl
    }, { onConflict: 'subject_name' });
    if (masteryErr) log(`Mastery Sync Err: ${masteryErr.message}`, 'WARNING');
}

function updateMarkdownArtifacts(biz, emo) {
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
        const newTargetText = `## 📖 ACTIVE RESEARCH TARGETS\n- [v6.0] Study: **${biz}** & **${emo}** [GRADUATED ${timestamp}]\n\n>`;
        content = content.replace(targetRegex, newTargetText);
        fs.writeFileSync(docSyllabusPath, content);
    }

    // Update Archive
    const logArchive = `- [v6.0-HARDENED] Success: ${biz} & ${emo} at ${timestamp}\n`;
    fs.appendFileSync(archivePath, logArchive);
}

runAutonomousSchooling();
