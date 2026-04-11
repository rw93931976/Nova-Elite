const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 🛠️ LOAD CONFIG FROM .ENV
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const supabaseUrl = env['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL;
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = env['OPENAI_API_KEY'] || process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const logDir = path.join(__dirname, 'nova-data');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, 'sovereign.log');

function log(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    fs.appendFileSync(logFile, entry + '\n');
}

async function executeLLM(jobPayload) {
    const model = 'gpt-4o-mini';
    // FIX: Deep payload resolution
    const rawPayload = jobPayload.payload || jobPayload;
    const finalPayload = rawPayload.payload || rawPayload;

    let messages = [];
    if (finalPayload?.contents) {
        messages = finalPayload.contents.map(c => ({
            role: c.role === 'user' ? 'user' : (c.role === 'system' ? 'system' : 'assistant'),
            content: (Array.isArray(c.parts) ? c.parts.map(p => p.text).join('') : (c.text || ''))
        })).filter(m => m.content);
    } else if (finalPayload?.messages) {
        messages = finalPayload.messages;
    } else if (finalPayload?.prompt) {
        messages = [{ role: 'user', content: finalPayload.prompt }];
    }

    if (messages.length === 0) {
        messages = [{ role: 'user', content: "Hi Nova." }];
    }

    // Ensure there's a system message for intent if missing
    if (!messages.some(m => m.role === 'system')) {
        messages.unshift({ role: 'system', content: "You are Nova, Ray's Sovereign AI assistant. You are capable of complex reasoning and tool use. Be concise, direct, and slightly futuristic." });
    }

    const body = JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7 });

    const res = await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            }
        }, r => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed);
                } catch (e) { reject(new Error('Parse fail: ' + data.substring(0, 100))); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });

    log(`[LLM] OpenAI success. Input tokens: ${messages.reduce((a, b) => a + b.content.length, 0)} chars`);
    return res;
}

async function executeSearch(jobPayload) {
    const rawPayload = jobPayload.payload || jobPayload;
    const finalPayload = rawPayload.payload || rawPayload;
    const query = finalPayload?.query || "Nashville weather";

    log(`[Search] Querying for: ${query}`);

    const messages = [
        { role: 'system', content: "You are a Real-Time Search Engine. Provide current facts based on your knowledge. Return a JSON object with a 'results' array containing { title, Content } objects." },
        { role: 'user', content: `Perform a search for: ${query}` }
    ];

    const body = JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' }
    });

    const llmRes = await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            }
        }, r => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed);
                } catch (e) { reject(new Error('Parse fail')); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });

    try {
        const resultText = llmRes.choices[0].message.content;
        return JSON.parse(resultText);
    } catch {
        return { results: [{ title: 'Search Error', Content: 'Could not resolve query.' }] };
    }
}

let isPolling = false;

async function pollJobs() {
    if (isPolling) return;
    isPolling = true;
    try {
        const { data: jobs, error } = await supabase
            .from('relay_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) {
            log(`[Relay] Poll Error: ${error.message}`);
            return;
        }

        if (!jobs || jobs.length === 0) return;

        const job = jobs[0];
        log(`[Relay] Processing ${job.id} (${job.type})`);

        await supabase.from('relay_jobs').update({ status: 'processing' }).eq('id', job.id);

        try {
            let result;
            if (job.type === 'search' || job.type === 'weather') {
                result = await executeSearch(job);
            } else if (job.type === 'file') {
                const filePath = job.payload.path;
                log(`[File] Reading: ${filePath}`);
                try {
                    result = fs.readFileSync(filePath, 'utf8');
                } catch (e) {
                    result = `FILE_ERROR: Could not read ${filePath}. ${e.message}`;
                }
            } else if (job.type === 'notebook') {
                const url = job.payload.url;
                log(`[Notebook] Accessing: ${url}`);
                try {
                    if (url.startsWith('file:///')) {
                        const localPath = url.replace('file:///', '');
                        const fullPath = path.isAbsolute(localPath) ? localPath : path.join(__dirname, localPath);
                        result = fs.readFileSync(fullPath, 'utf8');
                    } else {
                        const res = await new Promise((resolve, reject) => {
                            const r = https.get(url, (res) => {
                                let data = '';
                                res.on('data', d => data += d);
                                res.on('end', () => resolve(data));
                            });
                            r.on('error', reject);
                        });
                        result = `CONTENT_FETCHED: ${res.substring(0, 5000)}...`;
                    }
                } catch (e) {
                    result = `NOTEBOOK_ERROR: ${e.message}`;
                }
            } else if (job.type === 'write_file') {
                const filePath = job.payload.path;
                const content = job.payload.content;
                log(`[Scribe] Writing: ${filePath}`);
                try {
                    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
                    const dir = path.dirname(fullPath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(fullPath, content, 'utf8');
                    result = `WRITE_SUCCESS: ${filePath}`;
                } catch (e) {
                    result = `WRITE_ERROR: ${e.message}`;
                }
            } else if (job.type === 'backup') {
                log(`[Backup] Pulse Initiated...`);
                try {
                    const backupDir = path.join(__dirname, 'nova-data', 'backups');
                    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                    const file = path.join(backupDir, `sovereign_sync_${Date.now()}.json`);
                    // Simple manifest backup for now
                    const manifest = fs.readFileSync(path.join(__dirname, 'SOVEREIGN_AUTONOMY_MANIFEST_V2.md'), 'utf8');
                    fs.writeFileSync(file, JSON.stringify({ manifest, timestamp: new Date() }), 'utf8');
                    result = `BACKUP_SUCCESS: ${file}`;
                } catch (e) {
                    result = `BACKUP_ERROR: ${e.message}`;
                }
            } else if (job.type === 'command') {
                const cmd = job.payload.command;
                log(`[Agency] Executing Command: ${cmd}`);
                try {
                    const { execSync } = require('child_process');
                    const output = execSync(cmd, { encoding: 'utf8', cwd: __dirname });
                    result = output;
                } catch (e) {
                    result = `EXEC_ERROR: ${e.message}`;
                }
            } else if (job.type === 'notebook_write') {
                const notebookId = job.payload.notebook_id;
                const content = job.payload.content;
                log(`[Study] Writing to Notebook: ${notebookId}`);
                try {
                    const notebookDir = path.join(__dirname, 'nova-data', 'notebooks');
                    if (!fs.existsSync(notebookDir)) fs.mkdirSync(notebookDir, { recursive: true });
                    const file = path.join(notebookDir, `${notebookId}_sync.md`);
                    fs.writeFileSync(file, content, 'utf8');
                    result = `NOTEBOOK_WRITE_SUCCESS: ${file}`;
                } catch (e) {
                    result = `NOTEBOOK_WRITE_ERROR: ${e.message}`;
                }
            } else if (job.type === 'cleanup') {
                log(`[Env] Cleaning temporary artifacts...`);
                try {
                    const tmpDir = path.join(__dirname, 'tmp');
                    if (fs.existsSync(tmpDir)) {
                        const files = fs.readdirSync(tmpDir);
                        files.forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
                        result = `CLEANUP_SUCCESS: Purged ${files.length} files.`;
                    } else {
                        result = `CLEANUP_SUCCESS: No tmp directory found.`;
                    }
                } catch (e) {
                    result = `CLEANUP_ERROR: ${e.message}`;
                }
            } else {
                result = await executeLLM(job);
            }

            await supabase.from('relay_jobs')
                .update({ status: 'completed', result, updated_at: new Date().toISOString() })
                .eq('id', job.id);
            log(`[Relay] Done ${job.id}`);
        } catch (e) {
            log(`[Relay] Error ${job.id}: ${e.message}`);
            await supabase.from('relay_jobs')
                .update({ status: 'failed', error: e.message, updated_at: new Date().toISOString() })
                .eq('id', job.id);
        }
    } catch (e) {
        log(`[Relay] Critical Poll Loop Error: ${e.message}`);
    } finally {
        isPolling = false;
    }
}

// HEARTBEAT REMOVED TO PREVENT ROBOTIC ECHOES

log('🚀 [Relay] Polling active (v2.9 Deep Sensory Fix)...');
setInterval(pollJobs, 500); // Increased polling speed!
