/**
 * Kate sandbox training pulse — spawns Content Architect + Outbound Prospect
 * per training tenant, queues human-gated tasks to Supabase nova_tasks.
 *
 * Usage (droplet or local with .env):
 *   KATE_SANDBOX_MODE=1 node scripts/sandbox-pulse.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
const LOG_FILE = path.join(ROOT, 'nova-data', 'sandbox', 'sandbox-pulse.log');

function loadEnv() {
  const env = { ...process.env };
  for (const name of ['.env', '.env.local']) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    fs.readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .forEach((line) => {
        const i = line.indexOf('=');
        if (i > 0 && !line.trimStart().startsWith('#')) {
          env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
      });
  }
  return env;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const TENANTS = [
  {
    id: 'my-simple-ai-help',
    displayName: 'My Simple AI Help',
    offerSummary:
      'Plain-language AI setup and operator-grade voice systems for trades and SMB.',
  },
  {
    id: 'rons-art',
    displayName: "Ron's Art",
    offerSummary: 'Original art, commissions, and curated pieces.',
  },
];

const PAIN_QUERIES = [
  'HVAC owner missed calls after hours complaint',
  'plumbing company losing jobs voicemail frustration',
  'small electrical contractor dispatch phone chaos',
];

async function tavilySearch(apiKey, query) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5,
    }),
  });
  if (!res.ok) return '';
  const data = await res.json();
  return data.answer || (data.results || []).map((r) => r.content).join('\n\n');
}

async function runPulse() {
  const env = loadEnv();
  if (env.KATE_SANDBOX_MODE !== '1' && env.KATE_SANDBOX_MODE !== 'true') {
    log('KATE_SANDBOX_MODE off — exit. Set KATE_SANDBOX_MODE=1 to run.');
    process.exit(0);
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const tavilyKey = env.VITE_TAVILY_API_KEY || env.TAVILY_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('Missing Supabase URL/key.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  log('Sandbox pulse start — training tenants only, human gate on all sends.');

  let painBlob = 'Pain scan skipped — no Tavily key.';
  if (tavilyKey) {
    const chunks = [];
    for (const q of PAIN_QUERIES.slice(0, 2)) {
      chunks.push(`QUERY: ${q}\n${await tavilySearch(tavilyKey, q)}`);
    }
    painBlob = chunks.join('\n\n');
  }

  for (const tenant of TENANTS) {
    const platforms = ['x', 'pinterest', 'linkedin'];
    for (const platform of platforms) {
      const text = `[${tenant.displayName}] Sandbox ${platform} draft — ${tenant.offerSummary} (approve before post).`;
      const { error } = await supabase.from('nova_tasks').insert({
        title: `[${tenant.displayName}] ${platform} post — approve`,
        description: text,
        status: 'pending',
        priority: 'medium',
        metadata: {
          sandbox: true,
          tenant_id: tenant.id,
          agent: 'content-architect',
          action: 'post_draft',
          platform,
          assignee: 'ray',
          human_gate: true,
        },
      });
      if (error) log(`Post queue failed (${tenant.id}/${platform}): ${error.message}`);
    }

    const emailDraft = `Subject: Quick thought on after-hours calls\n\nHi —\n\nWe help trades shops (1–15 techs) stop losing jobs to voicemail. Saw public signals similar to: ${painBlob.slice(0, 200)}…\n\n15-minute walkthrough if useful.\n\n— Ray\n\n[Queued by Kate sandbox — Ray approves before send]`;

    const { error: emailErr } = await supabase.from('nova_tasks').insert({
      title: `Outbound (${tenant.displayName} stream) — email approve`,
      description: emailDraft,
      status: 'pending',
      priority: 'high',
      metadata: {
        sandbox: true,
        tenant_id: tenant.id,
        agent: 'outbound-prospect',
        action: 'outbound_email',
        pain_summary: painBlob.slice(0, 1500),
        assignee: 'ray',
        human_gate: true,
        reveal_on_call: 'Ray explains system did research + draft; human only at approval.',
      },
    });
    if (emailErr) log(`Email queue failed (${tenant.id}): ${emailErr.message}`);
    else log(`Queued posts + outbound email for ${tenant.displayName}`);
  }

  log('Pulse complete — review nova_tasks in Control Room.');
}

runPulse().catch((e) => {
  log(`Pulse error: ${e.message}`);
  process.exit(1);
});
