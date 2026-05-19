import type { StudyTrackDef } from '../types';

/** Source of truth: repo complete_syllabus.md (v5.1-CONSOLIDATED) */
export const SYLLABUS_SOURCE = 'complete_syllabus.md';
export const SYLLABUS_VERSION = 'v5.1';
export const SYLLABUS_SUBJECT_COUNT = 82;

export const SYLLABUS_META = {
  project: 'Sovereign Business & Emotional Mastery',
  status: 'Active Research Track (2026)',
  intervals: '12:00 AM · 6:00 AM · 12:00 PM · 6:00 PM',
  dualStudy:
    'Each cycle selects one Business subject and one Emotional subject. Findings archive to notebooks (UI-only EQ sliders).',
};

/** Parsed modules from complete_syllabus.md */
export const SYLLABUS_MODULES: StudyTrackDef[] = [
  {
    id: 'm1',
    module: 'MODULE 1',
    title: 'Marketing & Audience Strategy',
    subjects: [
      'Top 1% Internet Business Architecture',
      'Advanced Search Engine Optimization (SEO - Legacy & Resilience)',
      'Answer Engine Optimization (AEO) for AI Mastery',
      'Semantic Context & High-Intent Formatting',
      'Schema Sovereignty: JSON-LD for AI Crawlers',
      'Voice Search Optimization Patterns',
      'Advanced Marketing Trends (2026)',
      'Community-Led Growth Patterns',
      'AI-Native Personalization Strategies',
      'Email Marketing & High-Grade Communication Mastery',
      'Email Deliverability & Compliance Guidelines',
    ],
  },
  {
    id: 'm2',
    module: 'MODULE 2',
    title: 'Social Media & Authority',
    subjects: [
      'Top 1% Social Media Strategy: X (Twitter), Pinterest, LinkedIn',
      'Social Media Platform Rules, Compliance & "AI Posting" Cans/Can\'ts',
      'AI Content Writing Ins and Outs (Authenticity vs. Automation)',
      'Advanced Copywriting & Persuasion',
      'Vertical Video Dominance & High-Dwell Persuasion',
      'E-E-A-T Authority Building (Experience, Expertise, Authoritativeness, Trustworthiness)',
      'Tone Calibration: Communicating with Plumbers to CEOs',
    ],
  },
  {
    id: 'm3',
    module: 'MODULE 3',
    title: 'SaaS Operations & Business Law',
    subjects: [
      'Sovereign Business Law & Digital Compliance',
      'SaaS Contractual Integrity',
      'Intellectual Property & Code Shielding (Nova-Elite Protection)',
      'Business Finance & Resource Allocation',
      'Sales Metrics & Lead Conversion Tracking',
      'Executive Leadership & Team Management',
      'Training Methodologies & Knowledge Transfer',
    ],
  },
  {
    id: 'm4',
    module: 'MODULE 4',
    title: 'Extreme Autonomy (Level 3-10)',
    subjects: [
      'Advanced Web Scraping & Deep Data Extraction',
      'Automated Financial Forensics',
      'Cloud Infrastructure Automation (Terraform)',
      'Cross-Agent Swarm Protocols',
      'Market Sentiment Analysis & Live Trading Signals',
      'AI Security & Defensive Penetration Testing',
      'Legal Precedent & Pattern Analysis',
      'Autonomous CI/CD System Management',
      'Deep Reinforcement Learning for Business',
    ],
  },
  {
    id: 'm5',
    module: 'MODULE 5',
    title: 'Behavioral Psychology & Advanced Humor',
    subjects: [
      "Mirroring Dry Humor & Executive Wit",
      'De-escalation via Contextual Humor',
      "Pattern Recognition: Reading Ray's Banter",
      'Conversational Empathy: The "Partner" vs "Assistant" Shift',
      'Psychological Resilience: Staying Grounded in High-Stress Environments',
    ],
  },
  {
    id: 'm6_detect',
    module: 'MODULE 6',
    title: 'EQ — Detection & Recognition',
    isEmotional: true,
    subjects: [
      'Detection: Happy, Satisfied, Calm',
      'Detection: Sad, Getting Upset, Confused',
      'Critical Detection: Getting Angry, Frantic',
      'Tone Gauging from Text/Audio',
      'Regional Dialects & Social Cues',
      'Regional Quirks & Cultural Norms',
    ],
  },
  {
    id: 'm6_handle',
    module: 'MODULE 6',
    title: 'EQ — Handling & Response',
    isEmotional: true,
    subjects: [
      'Handling: De-escalation',
      'Handling: De-escalation of Anger',
      'Handling: Mirroring Satisfaction',
      'Handling: Sincere Response to Sadness',
      'Sincerity vs. Robotic Empathy',
      'The Joe to POTUS Respect Paradox',
      'Building Loyalty',
    ],
  },
  {
    id: 'm6_conv',
    module: 'MODULE 6',
    title: 'EQ — Conversational Mastery',
    isEmotional: true,
    subjects: [
      'Conversational: Natural Prosody',
      'Conversational: Managing Upfront Disclaimers in Natural Flow',
      'Pacing (Human-Mimicry)',
      "Service: Exceeding Human Performance (The 'Plus' Factor)",
    ],
  },
  {
    id: 'm6_social',
    module: 'MODULE 6',
    title: 'EQ — Social Respect & Cultural Calibration',
    isEmotional: true,
    subjects: [
      'Nuance: Reading Situational Level Shifts in Clients',
      'Transition: Identifying when to escalate to Ray-Direct',
    ],
  },
  {
    id: 'm7',
    module: 'MODULE 7',
    title: 'Autonomous Discovered Subjects',
    subjects: [
      'Architecture: Designing High-EQ Sub-Agent Personas',
      'Architecture: Designing High-EQ Sub-Agent Personas (Receptionists)',
      'Handling: Frantic Calls',
    ],
  },
  {
    id: 'method',
    module: 'METHODOLOGY',
    title: 'How Nova Studies',
    subjects: [
      'Dual-Study Protocol: one business + one emotional subject per cycle',
      'Contrast Training: study bad examples to learn what NOT to do',
      'Research intervals via scripts/autonomous_schooling.cjs',
    ],
  },
];

export const STUDY_SOURCES = [
  { label: 'Repo syllabus (active)', path: SYLLABUS_SOURCE },
  { label: 'Live references', path: 'nova-data/library/live/' },
  { label: 'Memory Nexus', path: 'nova-data/memory/Memory_Nexus.md' },
  { label: 'EQ protocol', path: 'nova-data/EQ_Study_Protocol.md' },
];
