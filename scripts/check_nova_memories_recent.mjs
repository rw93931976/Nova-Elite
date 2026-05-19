import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
for (const name of ['.env', 'nova_env_soul.env', 'vps.env']) {
  const p = path.join(root, name);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !process.env[line.slice(0, i).trim()])
      process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase URL/key');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('nova_memories')
  .select('id, category, content, created_at, metadata')
  .order('created_at', { ascending: false })
  .limit(15);

if (error) {
  console.error('Query error:', error.message);
  process.exit(1);
}

console.log(`Latest ${data?.length ?? 0} rows in nova_memories:\n`);
for (const row of data ?? []) {
  const preview = (row.content || '').replace(/\s+/g, ' ').slice(0, 100);
  const src = row.metadata?.source ?? '';
  const room = row.metadata?.room ?? '';
  console.log(`${row.created_at} | ${row.category} | ${preview}${preview.length >= 100 ? '…' : ''}`);
  if (src) console.log(`  meta: source=${src} room=${room}`);
}

const voiceToday = (data ?? []).filter(
  r =>
    r.metadata?.source === 'voice' ||
    (r.category === 'session_summary' && r.created_at?.startsWith('2026-05-18')),
);
console.log(`\nVoice-tagged or today's session_summary in this batch: ${voiceToday.length}`);
