import React from 'react';
import { GlassPanel } from './GlassPanel';

/** Matches memory.py _LIVE_REFERENCE_SPECS + study index (on-disk in repo). */
const LIVE_FILES = [
  'Nova-Decision-Log.md',
  'PROJECT_NOVA_ARCHITECTURE_BLUEPRINT_UPDATED-1.md',
  'Nova-SOVEREIGN-AUTONOMY-MANIFEST-v2.2.md',
  'Nova-Capabilities.md',
  'Nova-Study-Index.md',
];

const VOICE_FLAGS = [
  { key: 'NOVA_LIVE_REFERENCES=1', desc: 'Policy, blueprint, manifest, capabilities' },
  { key: 'NOVA_STUDY_INDEX=1', desc: 'Syllabus / recovery pointers' },
  { key: 'NOVA_SCHEDULING=1', desc: 'Clock + events.json' },
  { key: 'Supabase + OPENAI_API_KEY', desc: 'Session memory load / persist' },
];

export const MemoryWiringPanel: React.FC = () => (
  <GlassPanel accent="cyan" title="Memory & live references" subtitle="Voice worker (agent-droplet.py) — not the dashboard UI">
    <p className="wiring-intro">
      Cleaned files live in <code>nova-data/library/live/</code>. On the droplet, set flags in{' '}
      <code>.env.local</code> (see <code>.env.local.example</code>) and run{' '}
      <code>python scripts/verify_memory_wiring.py</code>.
    </p>
    <div className="wiring-grid">
      <div>
        <h4 className="wiring-h4">On-disk (this repo)</h4>
        <ul className="wiring-list">
          {LIVE_FILES.map(f => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="wiring-h4">Worker env</h4>
        <ul className="wiring-list">
          {VOICE_FLAGS.map(f => (
            <li key={f.key}>
              <code>{f.key}</code>
              <span>{f.desc}</span>
            </li>
          ))}
        </ul>
        </div>
    </div>
    <p className="wiring-note">
      Session write runs after voice ends (close handler). Notebook authoring stays disabled in the control room.
    </p>
  </GlassPanel>
);
