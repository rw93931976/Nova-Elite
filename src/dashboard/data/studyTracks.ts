import type { StudyTrackDef } from '../types';

/** Source: complete_syllabus.md (v5.1) + EQ_Study / Novas Emotions guidelines */
export const STUDY_TRACKS: StudyTrackDef[] = [
  {
    id: 'm1',
    module: 'Module 1',
    title: 'Marketing & Audience Strategy',
    subjects: [
      'AEO for AI mastery',
      'Schema sovereignty (JSON-LD)',
      'Voice search patterns',
      'Community-led growth',
    ],
  },
  {
    id: 'm2',
    module: 'Module 2',
    title: 'Social Media & Authority',
    subjects: [
      'X, Pinterest, LinkedIn strategy',
      'E-E-A-T authority building',
      'Tone calibration (plumber to CEO)',
    ],
  },
  {
    id: 'm3',
    module: 'Module 3',
    title: 'SaaS Operations & Business Law',
    subjects: [
      'Sovereign business law',
      'SaaS contractual integrity',
      'Sales metrics and conversion',
    ],
  },
  {
    id: 'm4',
    module: 'Module 4',
    title: 'Extreme Autonomy (L3–L10)',
    subjects: [
      'Deep data extraction',
      'Swarm protocols',
      'AI security and pen testing',
    ],
  },
  {
    id: 'm5',
    module: 'Module 5',
    title: 'Behavioral Psychology & Humor',
    subjects: [
      "Mirroring Ray's banter",
      'De-escalation via humor',
      'Partner vs assistant shift',
    ],
  },
  {
    id: 'eq_core',
    module: 'Emotional Learning',
    title: 'Emotional Intelligence & Human Nuance',
    isEmotional: true,
    subjects: [
      'Detection: calm → frantic spectrum',
      'De-escalation of anger',
      'Sincerity vs robotic empathy',
      'Natural prosody and pacing',
      'Regional dialects and cultural cues',
      'Contrast training (bad vs good service)',
    ],
  },
  {
    id: 'eq_voice',
    module: 'Emotional Learning',
    title: 'Voice-First Empathy Chain',
    isEmotional: true,
    subjects: [
      'Pitch, volume, speed estimators',
      'Mood state machine',
      'Tone adjustment layer',
      'Memory tie-in (mood + outcome)',
    ],
  },
  {
    id: 'method',
    module: 'Methodology',
    title: 'Dual-Study Protocol',
    subjects: [
      'One business + one emotional subject per cycle',
      'Cron: 12a · 6a · 12p · 6p (America/Chicago)',
      'Contrast training with negative examples',
    ],
  },
];

export const STUDY_SOURCES = [
  { label: 'Live references', path: 'nova-data/library/live/' },
  { label: 'Memory Nexus', path: 'nova-data/memory/Memory_Nexus.md' },
  { label: 'EQ protocol', path: 'nova-data/EQ_Study_Protocol.md' },
  { label: 'Doctorate syllabus', path: 'complete_syllabus.md' },
  { label: 'Education scratchpad', path: 'NOVA_EDUCATION_SCRATCHPAD.md' },
];
