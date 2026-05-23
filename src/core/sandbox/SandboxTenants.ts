/** Sandbox training tenants — mistakes OK here, not on client phone lines. */
export type SandboxPlatform = 'x' | 'pinterest' | 'linkedin';

export interface SandboxTenant {
  id: string;
  displayName: string;
  purpose: string;
  platforms: SandboxPlatform[];
  brainPath: string;
  voiceNotes: string;
  offerSummary: string;
}

export const SANDBOX_PLATFORMS: SandboxPlatform[] = ['x', 'pinterest', 'linkedin'];

export const SANDBOX_TRAINING_TENANTS: SandboxTenant[] = [
  {
    id: 'my-simple-ai-help',
    displayName: 'My Simple AI Help',
    purpose: 'Book / thought leadership — AI help for operators and founders.',
    platforms: SANDBOX_PLATFORMS,
    brainPath: 'nova-data/sandbox/tenants/my-simple-ai-help/BRAIN.md',
    voiceNotes: 'Direct, practical, dry humor. Peer-to-peer with business owners. No hype.',
    offerSummary: 'Plain-language AI setup and operator-grade voice systems for trades and SMB.',
  },
  {
    id: 'rons-art',
    displayName: "Ron's Art",
    purpose: 'Art brand — visual work, commissions, gallery-style presence.',
    platforms: SANDBOX_PLATFORMS,
    brainPath: 'nova-data/sandbox/tenants/rons-art/BRAIN.md',
    voiceNotes: 'Warm, visual, story-forward. Let the work lead; minimal hard sell.',
    offerSummary: 'Original art, commissions, and curated pieces for collectors and spaces.',
  },
];

/** ICP pain queries for outbound prospecting (Phase 1 trades). */
export const OUTBOUND_PAIN_QUERIES = [
  'HVAC owner missed calls after hours complaint forum',
  'plumbing company losing jobs voicemail frustration',
  'small electrical contractor dispatch phone chaos',
  'trades business owner AI receptionist looking for solution',
];

export function getSandboxTenant(id: string): SandboxTenant | undefined {
  return SANDBOX_TRAINING_TENANTS.find((t) => t.id === id);
}
