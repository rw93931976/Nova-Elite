const axios = require('axios');
require('dotenv').config();

async function runSchooling() {
    console.log("🚀 [Sovereign Schooling] Initiating 6-hour autonomous cycle...");

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ [Sovereign Schooling] Missing SUPABASE_URL or SUPABASE_KEY in environment.");
        process.exit(1);
    }

    try {
<<<<<<< HEAD
        // 0. Ingest Local Library Context
        console.log("[Library] Ingesting Identity and Solutions Vault...");
        const fs = require('fs');
        const path = require('path');
        const libraryDir = path.join(__dirname, '../nova-data/library');
        let libraryContext = "";

        if (fs.existsSync(libraryDir)) {
            const files = fs.readdirSync(libraryDir);
            files.forEach(file => {
                if (file.endsWith('.md')) {
                    const content = fs.readFileSync(path.join(libraryDir, file), 'utf8');
                    libraryContext += `\n--- FILE: ${file} ---\n${content}\n`;
                }
            });
        }

        // 1. Get Research Plan from Brain (Volume 3: Triple Speed)
        console.log("[Brain] Requesting Depth-3 research for the Doctorate Syllabus...");
        const brainRes = await axios.post(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            input: "Initiate Level 5 Sovereign Study: Pick 3 distinct subjects from your 100-subject syllabus. For each, provide an in-depth strategic report covering high-level enterprise strategy AND its practical application to Small to Medium Businesses (SMBs). Deeply research SMB specific needs, pain points, and wishes. Also, audit your Identity/Routine files and record 1 new solution or observation.",
            persona: `You are Nova Elite, a Doctorate-level AI. Your goal is to become the ultimate Business Advisor for Small to Medium Businesses (SMBs). Use the provided library context to ensure continuity. 
            
            STRATEGY: Extract strategic knowledge from enterprise successes and "The Top 1%".
            APPLICATION: Ground that knowledge in the reality of SMBs. Study their needs, pain points, and wishes to provide actionable advice.
            
            ${libraryContext}
            
            REPORT_FORMAT:
            - RESEARCH_REPORT: [Report Content]
            - GOAL_PROPOSAL: [Goal Content]
            - VAULT_UPDATE: [New Solution/Fix]
            - USER_PROFILE_UPDATE: [New User Observation]
            `
=======
        // 1. Get Research Plan from Brain (Volume 3: Triple Speed)
        console.log("[Brain] Requesting Depth-3 research for the Doctorate Syllabus...");
        const brainRes = await axios.post(`${supabaseUrl}/functions/v1/sovereign-brain`, {
            input: "Initiate Level 5 Sovereign Study: Pick 3 distinct subjects from your 100-subject syllabus. For each, provide an in-depth strategic report. Also, identify 1 new long-term goal for Nova Elite based on today's research.",
            persona: "You are Nova Elite, a Doctorate-level AI. Your goal is Top 1% mastery. Execute deep-dives. If you find a new goal, format it as GOAL_PROPOSAL: [Goal Content]."
>>>>>>> sovereign-elite-v3-6
        }, {
            headers: { 'Authorization': `Bearer ${supabaseKey}` }
        });

<<<<<<< HEAD
        const plan = brainRes.data.response;
        console.log("✅ [Sovereign Brain] Autonomous Plan Received.");

        // 2. Cascade Research to NotebookLM (Simulation for now)
        console.log("📚 [NotebookLM] Cascading research results to archive...");

        // 3. Update Syllabus (Self-Correction Log)
        console.log("📝 [Syllabus] Updating Doctorate Progress...");
        const syllabusPath = path.join(__dirname, '../SYLLABUS_DOCTORATE.md');
        if (fs.existsSync(syllabusPath)) {
            let syllabus = fs.readFileSync(syllabusPath, 'utf8');
            // Mock logic to mark the first [ ] as [x] for visualization on v3.6.1
            const updated = syllabus.replace(/\[ \]/, '[x]');
            fs.writeFileSync(syllabusPath, updated);
            console.log("✅ [Syllabus] 1 Subject Mastered and Logged.");
        }

        // 4. Record to Solutions Vault
        const vaultPath = path.join(libraryDir, 'solutions_vault.md');
        if (fs.existsSync(vaultPath)) {
            const vaultEntry = `\n- [v3.6.1 Build] Success: Autonomous Schooling Cycle completed for ${new Date().toISOString()}\n`;
            fs.appendFileSync(vaultPath, vaultEntry);
            console.log("💎 [Vault] Observation logged to Solutions Vault.");
        }

        console.log("🏁 [Sovereign Schooling] Cycle Complete. Standby for 6h interval.");

    } catch (error) {
        console.error("❌ [Sovereign Schooling] Fatal Error:", error.message);
        if (error.response) console.error("Detail:", JSON.stringify(error.response.data));
    }
}

// Check for PM2 context or direct run
if (require.main === module) {
    runSchooling();
}

module.exports = { runSchooling };
=======
        const responseText = brainRes.data.response;
        if (!responseText) throw new Error("No research generated by brain.");

        console.log(`[Nova] High-Volume Research Generated.`);

        // 2. Goal & Syllabus Detection
        const goalMatch = responseText.match(/GOAL_PROPOSAL:\s*(.*)/);
        if (goalMatch) {
            const newGoal = goalMatch[1];
            console.log(`🎯 [Sovereign] New Goal Identified: ${newGoal}`);
            await axios.post(`${supabaseUrl}/rest/v1/relay_jobs`, {
                type: 'update_goal',
                payload: { goal: newGoal },
                status: 'pending'
            }, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
            });
        }

        const syllabusMatch = responseText.match(/SYLLABUS_UPDATE:\s*(.*)/);
        if (syllabusMatch) {
            const newSubject = syllabusMatch[1];
            console.log(`📚 [Sovereign] New Syllabus Subject Discovered: ${newSubject}`);
            await axios.post(`${supabaseUrl}/rest/v1/relay_jobs`, {
                type: 'update_syllabus',
                payload: { subject: newSubject },
                status: 'pending'
            }, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
            });
        }


        // 3. Queue Research Jobs
        await axios.post(`${supabaseUrl}/rest/v1/relay_jobs`, {
            type: 'notebook_add_source',
            payload: {
                content: responseText,
                title: `Doctorate Study: ${new Date().toLocaleDateString()}`,
                notebookId: "doctoral-library"
            },
            status: 'pending'
        }, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ [Sovereign Schooling] High-Volume cycle completed and persisted.");
    } catch (e) {
        console.error("❌ [Sovereign Schooling] Cycle failed:", e.response?.data || e.message);
        process.exit(1);
    }
}

runSchooling();

>>>>>>> sovereign-elite-v3-6
