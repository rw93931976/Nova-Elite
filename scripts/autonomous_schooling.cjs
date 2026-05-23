require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });

const { createClient } = require('@supabase/supabase-js');

const { execFileSync } = require('child_process');

const fs = require('fs');

const path = require('path');



/**

 * 🎓 SOVEREIGN SCHOOLING ENGINE v6.3 (Spaces + one subject per session)

 * -------------------------------------------

 * Curriculum + state: DO Spaces (library/ssu/)

 * Study output: DO Spaces (mastery/, research/, eq/)

 * Schedule (America/Chicago): 06:00 · 12:00 · 18:00 = SSU business · 15:00 = AEO/SEO or EQ fallback

 * AEO runs every other day; on off-days the 3 PM slot runs EQ instead (4 sessions/day).

 * AEO goes daily during the 7 days before NOVA_LAUNCH_DATE (when set).

 *

 * Set NOVA_AUTONOMOUS_SCHOOLING=1 on droplet. Requires Tavily on sovereign-brain.

 */



const schoolingEnabled = (process.env.NOVA_AUTONOMOUS_SCHOOLING || '').trim() === '1';

if (!schoolingEnabled) {

    console.log(

        '[SCHOOLING] Autonomous schooling is OFF (NOVA_AUTONOMOUS_SCHOOLING!=1). Exiting without API calls.'

    );

    process.exit(0);

}



const supabaseUrl = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];

const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);



const repoRoot = path.join(__dirname, '..');

const notebooksDir = path.join(repoRoot, 'nova-data', 'notebooks');

const logFilePath = path.join(repoRoot, 'nova-data', 'schooling.log');

const schoolingStatePath = path.join(repoRoot, 'nova-data', 'schooling_state.json');

const ssuBusinessPath = path.join(repoRoot, 'nova-data', 'library', 'SSU_Business_Courses.md');

const aeoDailyPath = path.join(repoRoot, 'nova-data', 'library', 'SSU_AEO_SEO_Daily.md');

const eqDirectionsPath = path.join(repoRoot, 'nova-data', 'teaching', 'emotional_training_directions.md');

const docSyllabusPath = path.join(repoRoot, 'SYLLABUS_DOCTORATE.md');

const archivePath = path.join(repoRoot, 'Syllabus_Archive.md');

const spacesScript = path.join(__dirname, 'spaces_schooling.py');

const pythonBin =

    process.env.NOVA_PYTHON ||

    (fs.existsSync('/root/nova/.venv/bin/python3') ? '/root/nova/.venv/bin/python3' : 'python3');



const EMOTION_SUBJECTS = [

    'Partner EQ: Founder Decision Fatigue and Clear Thinking',

    'Partner EQ: Cognitive Sparring (Challenge Without Demoralizing)',

    'Partner EQ: Burnout Signals and Recovery Pacing',

    'Partner EQ: Imposter Syndrome Before High-Stakes Calls',

    'Partner EQ: Honest Pushback When Ray Is Moving Too Fast',

    'Conversational Empathy: The "Partner" vs "Assistant" Shift',

    'Psychological Resilience: Staying Grounded in High-Stress Environments',

    'Pattern Recognition: Reading Ray\'s Banter',

    'Critical Detection: Getting Angry, Frantic',

    'Handling: De-escalation',

    'Conversational: Natural Prosody',

];

const FOUNDER_EQ_INSTRUCTION =

    'FOUNDER PARTNER EQ: Study how Nova supports Ray as a strategic partner — stress, decision quality, honest pushback, and pacing. Not receptionist scripts. Follow Emotional Training Directions.';

const CUSTOMER_EQ_INSTRUCTION =

    'AI CONTROL: Study for future customer-facing emotion detection and high-EQ handling. Follow Emotional Training Directions.';

function emotionInstruction(subject) {

    if (subject.startsWith('Partner EQ:')) return FOUNDER_EQ_INSTRUCTION;

    if (

        subject.includes('Partner') ||

        subject.includes("Ray's Banter") ||

        subject.includes('Psychological Resilience')

    ) {

        return FOUNDER_EQ_INSTRUCTION;

    }

    return CUSTOMER_EQ_INSTRUCTION;

}



function log(msg, level = 'INFO') {

    const timestamp = new Date().toISOString();

    const formatted = `[${timestamp}] [${level}] ${msg}`;

    console.log(formatted);

    try {

        const dir = path.dirname(logFilePath);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.appendFileSync(logFilePath, formatted + '\n');

    } catch (e) {

        console.error('Critical: Failed to write to log file.', e.message);

    }

}



process.on('uncaughtException', (err) => {

    log(`FATAL: Uncaught Exception: ${err.message}`, 'ERROR');

    process.exit(1);

});



process.on('unhandledRejection', (reason) => {

    log(`FATAL: Unhandled Rejection: ${reason}`, 'ERROR');

    process.exit(1);

});



function runPython(args, { allowFail = false } = {}) {

    try {

        return execFileSync(pythonBin, [spacesScript, ...args], {

            env: process.env,

            encoding: 'utf8',

            timeout: 120000,

        }).trim();

    } catch (e) {

        if (!allowFail) log(`spaces_schooling ${args.join(' ')}: ${e.message}`, 'WARNING');

        return '';

    }

}



function syncStateFromSpaces() {

    runPython(['state-get', '--out', schoolingStatePath], { allowFail: true });

}



function syncStateToSpaces() {

    if (fs.existsSync(schoolingStatePath)) {

        runPython(['state-put', schoolingStatePath], { allowFail: true });

    }

}



function subjectsFromSpaces(track) {

    const out = runPython(['subjects', track], { allowFail: true });

    if (!out) return [];

    return out.split('\n').map((l) => l.trim()).filter(Boolean);

}



function parseBulletSubjects(filePath) {

    if (!fs.existsSync(filePath)) return [];

    return fs

        .readFileSync(filePath, 'utf8')

        .split('\n')

        .filter((l) => l.trim().startsWith('- '))

        .map((l) => l.replace(/^- /, '').trim())

        .filter(Boolean);

}



function loadSubjects(track) {

    const fromSpaces = subjectsFromSpaces(track);

    if (fromSpaces.length) return fromSpaces;

    const local = track === 'business' ? ssuBusinessPath : aeoDailyPath;

    return parseBulletSubjects(local);

}



function loadSchoolingState() {

    if (!fs.existsSync(schoolingStatePath)) return {};

    try {

        return JSON.parse(fs.readFileSync(schoolingStatePath, 'utf8'));

    } catch {

        return {};

    }

}



function saveSchoolingState(state) {

    const dir = path.dirname(schoolingStatePath);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(schoolingStatePath, JSON.stringify(state, null, 2));

    syncStateToSpaces();

}



function chicagoDateString() {

    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());

}



function daysBetween(startIso, endIso) {

    const a = new Date(`${startIso}T12:00:00`);

    const b = new Date(`${endIso}T12:00:00`);

    return Math.round((b - a) / 86400000);

}



function aeoDailyMode() {

    return (process.env.NOVA_AEO_DAILY || '').trim() === '1';

}



function inLaunchWeek() {

    const launch = (process.env.NOVA_LAUNCH_DATE || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(launch)) return false;

    const daysToLaunch = daysBetween(chicagoDateString(), launch);

    return daysToLaunch >= 0 && daysToLaunch <= 7;

}



function aeoDueToday() {

    if (aeoDailyMode() || inLaunchWeek()) return true;

    const state = loadSchoolingState();

    const today = chicagoDateString();

    const last = state.last_aeo_date;

    if (!last) return true;

    return daysBetween(last, today) >= 2;

}



function markAeoRunToday() {

    const state = loadSchoolingState();

    state.last_aeo_date = chicagoDateString();

    saveSchoolingState(state);

}



function getChicagoHour() {

    return parseInt(

        new Intl.DateTimeFormat('en-US', {

            timeZone: 'America/Chicago',

            hour: 'numeric',

            hour12: false,

        }).format(new Date()),

        10

    );

}



function resolveSlot() {

    const forced = (process.env.SCHOOLING_SLOT || '').trim().toLowerCase();

    if (forced === 'business' || forced === 'search' || forced === 'emotion') return forced;

    const h = getChicagoHour();

    if (h >= 14 && h <= 16) return 'search';

    if (h >= 11 && h <= 13) return 'business';

    return 'business';

}



function nextSequentialSubject(list, stateKey, fallback) {

    if (!list.length) return fallback;

    const state = loadSchoolingState();

    const idx = Number.isInteger(state[stateKey]) ? state[stateKey] : 0;

    const subject = list[idx % list.length];

    state[stateKey] = (idx + 1) % list.length;

    saveSchoolingState(state);

    return subject;

}



function pickEmotionStudy(slotLabel) {

    const state = loadSchoolingState();

    const idx = Number.isInteger(state.eq_index) ? state.eq_index : 0;

    const subject = EMOTION_SUBJECTS[idx % EMOTION_SUBJECTS.length];

    state.eq_index = (idx + 1) % EMOTION_SUBJECTS.length;

    saveSchoolingState(state);

    return {

        slot: slotLabel,

        type: 'Emotion',

        subject,

        instruction: emotionInstruction(subject),

    };

}



function pickStudyForSession() {

    const slot = resolveSlot();

    const bizSubjects = loadSubjects('business');

    const searchSubjects = loadSubjects('search');



    if (slot === 'search') {

        if (!aeoDueToday()) {

            log('AEO off-day — running EQ study in the 3 PM slot instead', 'INFO');

            return pickEmotionStudy('search-eq');

        }

        return {

            slot,

            type: 'Search',

            subject: nextSequentialSubject(

                searchSubjects,

                'aeo_seo_daily_index',

                'Answer Engine Optimization (AEO) for AI Mastery'

            ),

            instruction:

                "PINPOINT AEO/SEO: execution rules first, 2026 best practice, deprecated tactics flagged, System Scale site application. End with a scannable do-this / don't-do-this checklist. No vague marketing fluff.",

        };

    }



    if (slot === 'emotion') {

        return pickEmotionStudy('emotion');

    }



    const state = loadSchoolingState();

    const businessCount = (state.business_session_count || 0) + 1;

    state.business_session_count = businessCount;

    saveSchoolingState(state);



    if (businessCount % 6 === 0) {

        const eqIdx = Number.isInteger(state.eq_index) ? state.eq_index : 0;

        const subject = EMOTION_SUBJECTS[eqIdx % EMOTION_SUBJECTS.length];

        state.eq_index = (eqIdx + 1) % EMOTION_SUBJECTS.length;

        saveSchoolingState(state);

        return {

            slot: 'business-eq',

            type: 'Emotion',

            subject,

            instruction: emotionInstruction(subject),

        };

    }



    return {

        slot: 'business',

        type: 'Business',

        subject: nextSequentialSubject(bizSubjects, 'ssu_business_index', 'Marketing Management'),

        instruction:

            "SYSTEM SCALE UNIVERSITY: Phase 1 launch focus only — nationwide HVAC/plumbing/electrical field service, cold-start founder sales, voice agent economics, and trades go-to-market. No law, no HIPAA medical, no Phase 2 remodeling/CPA topics. One course, full depth.",

    };

}



async function runAutonomousSchooling() {

    log('🚀 Session starting (one subject, Spaces-backed)...');

    syncStateFromSpaces();



    try {

        if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase configuration.');



        const study = pickStudyForSession();

        if (study.skip) {

            log(`Skipping session: ${study.reason}`, 'INFO');

            return;

        }



        log(`Slot=${study.slot} Type=${study.type} Subject="${study.subject}"`);

        await performStudy(study);

        if (study.type === 'Search') markAeoRunToday();



        log('🏁 Session complete.');

        updateMarkdownArtifacts(study);

    } catch (error) {

        log(`Session failed: ${error.message}`, 'ERROR');

        process.exit(1);

    }

}



function pullNotebookFromSpaces(notebookPath, study) {

    const groupId = spacesGroupForStudy(study);

    const registryId = path.basename(notebookPath, '.md');

    runPython(['notebook-fetch', groupId, registryId, notebookPath], { allowFail: true });

}



async function performStudy(study) {

    log(`Processing Study: ${study.subject}...`);



    const notebookFilename = `${study.subject.replace(/\W/g, '_')}.md`;

    const notebookPath = path.join(notebooksDir, notebookFilename);

    const spacesKey = `${spacesGroupForStudy(study)}/${path.basename(notebookPath, '.md')}.md`;



    pullNotebookFromSpaces(notebookPath, study);



    const payload = {

        input: `DOCTORAL_RESEARCH_TASK: Deep study on "${study.subject}".

        RESEARCH_CONTEXT: ${study.instruction}

        ${study.type === 'Emotion' && fs.existsSync(eqDirectionsPath) ? `EQ_DIRECTIVES: ${fs.readFileSync(eqDirectionsPath, 'utf8')}` : ''}

        

        OBJECTIVE: Strategic Mapping & Synthesis of Execution Rules.

        NOTEBOOK_STORAGE: "spaces://${spacesKey}"

        INSTRUCTION: If the notebook exists, APPEND the new findings with a clear timestamp. If not, create a new high-fidelity Markdown notebook.`,

        persona: 'Nova Elite, System Scale University doctoral candidate.',

        silent: true,

    };



    const response = await fetch(`${supabaseUrl}/functions/v1/sovereign-brain`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },

        body: JSON.stringify(payload),

    });



    if (!response.ok) {

        const errBody = await response.text();

        throw new Error(`Edge Function Error (${response.status}): ${errBody}`);

    }



    const result = await response.json();

    const content = result.response || result.text || '';
    if (!content) throw new Error('Received empty content from research engine.');
    if (/Logic Snag:|Sovereign Gateway: High-intelligence providers failed/i.test(content)) {
        throw new Error(`Research engine failed: ${content.trim()}`);
    }



    archiveToFile(notebookPath, study.subject, content);

    pushArchiveToSpaces(notebookPath, study);

    await recordStudyProgress(study, spacesKey, content);

    await syncToDatabase(study, content, spacesKey);

    log(`Successfully completed ${study.type} study on ${study.subject}`);

}



function archiveToFile(filePath, subject, content) {

    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

    const noteEntry = `\n\n### 🎓 DOCTORAL STUDY [${timestamp}]\n**Subject**: ${subject}\n\n${content}\n\n---`;

    fs.appendFileSync(filePath, noteEntry);

}



function spacesGroupForStudy(study) {

    if (study.type === 'Emotion') return 'eq';

    if (study.type === 'Search') return 'research';

    if (study.type === 'Business') return 'mastery';

    return 'research';

}



function pushArchiveToSpaces(localPath, study) {

    const pushScript = path.join(__dirname, 'push_file_to_spaces.py');

    const groupId = spacesGroupForStudy(study);

    const registryId = path.basename(localPath, '.md');

    try {

        const out = execFileSync(pythonBin, [pushScript, localPath, groupId, registryId], {

            env: process.env,

            encoding: 'utf8',

            timeout: 120000,

        });

        log(`Spaces archive: ${(out || '').trim() || `${groupId}/${registryId}.md`}`);

    } catch (e) {

        const detail = e.stderr ? String(e.stderr).trim() : e.message;

        log(`Spaces upload skipped: ${detail}`, 'WARNING');

    }

}



const progressPath = path.join(repoRoot, 'nova-data', 'schooling_progress.json');
const breadcrumbsPath = path.join(repoRoot, 'nova-data', 'study_breadcrumbs.json');



function loadProgress() {

    runPython(['fetch', 'study_progress.json', '--out', progressPath], { allowFail: true });

    if (fs.existsSync(progressPath)) {

        try {

            return JSON.parse(fs.readFileSync(progressPath, 'utf8'));

        } catch {

            /* fresh progress file */

        }

    }

    return { completed: [] };

}



function saveProgress(progress) {

    progress.updated_at = new Date().toISOString();

    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

    runPython(['push', progressPath, 'study_progress.json'], { allowFail: true });

}



async function syncProgressDashboardSnapshot(progress) {
    const crumbs = loadBreadcrumbs();
    const payload = {
        progress,
        breadcrumbs: crumbs,
        synced_at: new Date().toISOString(),
    };

    try {
        await supabase.from('nova_memories').delete().eq('category', 'ssu_progress');
        const { error } = await supabase.from('nova_memories').insert({
            category: 'ssu_progress',
            content: JSON.stringify(payload),
            importance: 5,
            metadata: { version: '6.3', storage: 'spaces_mirror' },
        });
        if (error) log(`Dashboard sync failed: ${error.message}`, 'WARN');
        else log('Dashboard progress snapshot synced to Supabase');
    } catch (e) {
        log(`Dashboard sync error: ${e.message}`, 'WARN');
    }
}

async function recordStudyProgress(study, spacesKey, contentSnippet) {

    const progress = loadProgress();

    const entry = {

        subject: study.subject,

        type: study.type,

        slot: study.slot,

        spaces_key: spacesKey,

        completed_at: new Date().toISOString(),

    };

    const idx = progress.completed.findIndex(

        (c) => c.subject === study.subject && c.type === study.type

    );

    if (idx >= 0) progress.completed[idx] = entry;

    else progress.completed.push(entry);



    const bizTotal = loadSubjects('business').length;

    const searchTotal = loadSubjects('search').length;

    const bizDone = new Set(

        progress.completed.filter((c) => c.type === 'Business').map((c) => c.subject)

    ).size;

    const searchDone = new Set(

        progress.completed.filter((c) => c.type === 'Search').map((c) => c.subject)

    ).size;

    const eqDone = new Set(

        progress.completed.filter((c) => c.type === 'Emotion').map((c) => c.subject)

    ).size;



    progress.summary = {

        business: { done: bizDone, total: bizTotal, remaining: Math.max(0, bizTotal - bizDone) },

        search: { done: searchDone, total: searchTotal, remaining: Math.max(0, searchTotal - searchDone) },

        emotion: { done: eqDone, total: EMOTION_SUBJECTS.length },

    };

    saveProgress(progress);

    saveBreadcrumbs(study, spacesKey, contentSnippet);

    await syncProgressDashboardSnapshot(progress);

    log(

        `Progress: business ${bizDone}/${bizTotal}, AEO ${searchDone}/${searchTotal}, EQ ${eqDone}/${EMOTION_SUBJECTS.length}`

    );

}



function loadBreadcrumbs() {

    runPython(['fetch', 'study_breadcrumbs.json', '--out', breadcrumbsPath], { allowFail: true });

    if (fs.existsSync(breadcrumbsPath)) {

        try {

            return JSON.parse(fs.readFileSync(breadcrumbsPath, 'utf8'));

        } catch {

            /* fresh */

        }

    }

    return { entries: [] };

}



function saveBreadcrumbs(study, spacesKey, contentSnippet) {

    const crumbs = loadBreadcrumbs();

    const snippet = (contentSnippet || '').replace(/\s+/g, ' ').trim().slice(0, 280);

    const entry = {

        subject: study.subject,

        type: study.type,

        spaces_key: spacesKey,

        folder: spacesKey.split('/')[0],

        snippet,

        studied_at: new Date().toISOString(),

    };

    const idx = crumbs.entries.findIndex(

        (e) => e.subject === study.subject && e.type === study.type

    );

    if (idx >= 0) crumbs.entries[idx] = entry;

    else crumbs.entries.push(entry);

    crumbs.updated_at = new Date().toISOString();

    fs.writeFileSync(breadcrumbsPath, JSON.stringify(crumbs, null, 2));

    runPython(['push', breadcrumbsPath, 'study_breadcrumbs.json'], { allowFail: true });

    log(`Breadcrumb: ${spacesKey}`);

}



async function syncToDatabase(study, content, spacesKey) {
    const { error: memErr } = await supabase.from('nova_memories').insert({
        category: 'study_breadcrumb',
        content: `Studied "${study.subject}" (${study.type}). Archive: ${spacesKey}. ${content.replace(/\s+/g, ' ').trim().slice(0, 400)}`,
        importance: 4,
        metadata: {
            subject: study.subject,
            type: study.type,
            spaces_key: spacesKey,
            folder: spacesKey.split('/')[0],
            version: '6.3',
            storage: 'spaces',
        },
    });
    if (memErr) log(`Memory breadcrumb skipped: ${memErr.message}`, 'WARNING');
}



function updateMarkdownArtifacts(study) {

    const timestamp = new Date().toISOString();

    if (fs.existsSync(docSyllabusPath)) {

        let content = fs.readFileSync(docSyllabusPath, 'utf8');

        const mqRegex = /Mastery Quotient \(MQ\):\s*(\d+\.?\d*)/;

        const match = content.match(mqRegex);

        if (match) {

            const newMq = Math.min(100, parseFloat(match[1]) + 0.05).toFixed(1);

            content = content.replace(mqRegex, `Mastery Quotient (MQ): ${newMq}`);

        }

        const targetRegex = /## 📖 ACTIVE RESEARCH TARGETS[\s\S]*?>/;

        content = content.replace(

            targetRegex,

            `## 📖 ACTIVE RESEARCH TARGETS\n- [v6.3-SSU] ${study.type} (${study.slot}): **${study.subject}** [${timestamp}]\n\n>`

        );

        fs.writeFileSync(docSyllabusPath, content);

    }

    fs.appendFileSync(archivePath, `- [v6.3-SSU] ${study.type}/${study.slot}: ${study.subject} at ${timestamp}\n`);

}



runAutonomousSchooling();


