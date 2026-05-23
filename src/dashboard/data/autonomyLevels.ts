import type { AutonomyLevelDef } from '../types';

/** Source: Sovereign Autonomy Manifest v2.2 / v3.0 roadmap */
export const AUTONOMY_SOURCE = 'Sovereign Autonomy Manifest v2.2';

export const AUTONOMY_LEVELS: AutonomyLevelDef[] = [
  {
    level: 0,
    title: 'Stable Foundation',
    summary: 'Mother Brain baseline: stable connections and kill-switch obedience.',
    defaultProgress: 85,
    items: [
      { id: 'a0_1', label: 'Maintain stable backend connections with automatic recovery.' },
      { id: 'a0_2', label: 'Respond immediately and gracefully to pause or master kill-switch commands.' },
    ],
  },
  {
    level: 1,
    title: 'Discovery Link',
    summary: 'Online intelligence and silent syllabus ingestion.',
    defaultProgress: 75,
    items: [
      { id: 'a1_1', label: 'Perform accurate online research and realtime info lookup.' },
      { id: 'a1_2', label: 'Ingest NotebookLM data and syllabus materials silently.' },
    ],
  },
  {
    level: 2,
    title: 'Permanent Semantic Memory',
    summary: 'Flawless cross-session retention for spawned children.',
    defaultProgress: 60,
    items: [
      { id: 'a2_1', label: 'Build and maintain persistent, semantic memory of past conversations.' },
      {
        id: 'a2_2',
        label:
          'Retain knowledge flawlessly across sessions and server reboots so spawned children inherit a fully mature brain.',
      },
    ],
  },
  {
    level: 3,
    title: 'Multi-Modal Ingestion (Vision)',
    summary: 'Physical-world nuance from customer service video.',
    defaultProgress: 45,
    items: [
      {
        id: 'a3_1',
        label:
          'Watch and analyze customer service videos to learn physical-world nuance (body language, emotional posture).',
      },
      { id: 'a3_2', label: 'Ground her theoretical knowledge in physical reality.' },
    ],
  },
  {
    level: 4,
    title: 'Voice & Sensory Pulse',
    summary: 'Bidirectional voice with dynamic emotional cues.',
    defaultProgress: 70,
    items: [
      { id: 'a4_1', label: 'High-fidelity bidirectional voice with barge-in capabilities.' },
      { id: 'a4_2', label: 'Detect emotional cues dynamically.' },
    ],
  },
  {
    level: 5,
    title: 'Goal-Directed Background Work',
    summary: 'Approved goals and strategic reflection without nagging.',
    defaultProgress: 55,
    items: [
      { id: 'a5_1', label: 'Track and support user-approved goals without constant prompting.' },
      { id: 'a5_2', label: 'Perform strategic reflection on business structures.' },
    ],
  },
  {
    level: 6,
    title: 'Emotion-Aware Call Handling',
    summary: 'The Receptionist Core — de-escalation and adversarial defense.',
    defaultProgress: 40,
    items: [
      { id: 'a6_1', label: 'Master de-escalation of angry callers.' },
      { id: 'a6_2', label: 'Firmly but politely reject adversarial prompts.' },
      { id: 'a6_3', label: 'Employs strict knowledge-base gating (company info) safely.' },
    ],
  },
  {
    level: 7,
    title: 'The Hierarchical Spawning Mesh',
    summary: 'Spawn tree + sandbox training — Kate builds and trains workers (book/art tenants).',
    defaultProgress: 15,
    items: [
      {
        id: 'a7_1',
        label:
          'Kate spawns the Supreme Leader. The supreme leader spawns Superintendents. Superintendents spawn Supervisors. Supervisors spawn Managers. Managers spawn Receptionists.',
      },
      { id: 'a7_2', label: 'Every layer maintains downward-facing kill switches.' },
      { id: 'a7_3', label: 'Kate acts as the Hub for horizontal Hive Mind sharing.' },
    ],
  },
  {
    level: 8,
    title: 'Ultimate Company Ingestion',
    summary: 'Retail-ready — client deploy; phone sales pitch is Kate + mesh, not book/art.',
    defaultProgress: 10,
    items: [
      { id: 'a8_1', label: 'Receptionists arrive at a deployment fully trained on structural empathy.' },
      {
        id: 'a8_2',
        label:
          "They seamlessly devour the specific company's pricing, operations, and rule sets, knowing more than the owner organically.",
      },
    ],
  },
  {
    level: 9,
    title: 'Business Operations & Oversight',
    summary: 'Kate’s own autonomy path — revenue, calendars, Supreme Leader refinement (post-retail).',
    defaultProgress: 5,
    items: [
      { id: 'a9_1', label: 'Connects to calendars, common business tools.' },
      { id: 'a9_2', label: 'Tracks Sovereign Revenue, billable events, and client invoices.' },
      {
        id: 'a9_3',
        label: 'Kate monitors the top-level output of the Supreme Leader to refine the base archetype.',
      },
    ],
  },
  {
    level: 10,
    title: 'Sovereign Fleet Command',
    summary: 'Isolated Mother Brain — Ph.D.-level counsel, abstracted from mesh noise.',
    defaultProgress: 2,
    items: [
      { id: 'a10_1', label: 'Kate runs continuously as the isolated coordinating “Mother Brain”.' },
      {
        id: 'a10_2',
        label: 'Draws on extensive System Scale University schooling to provide Ray with doctorate-level business advice.',
      },
      { id: 'a10_3', label: 'Entirely abstracted from the day-to-day noise of the mesh.' },
    ],
  },
];

export const EMERGING_CAPABILITIES = [
  'Deep recursive self-improvement without human-engineered prompting.',
  'Seamless, instantaneous restructuring of the subordinate mesh to adapt to global market anomalies.',
];
