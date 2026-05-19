import type { FeatureGroupDef } from '../types';

/** Source: Desktop "Nova guidelines" / NOVA_ADVANCED_FEATURES.md */
export const FEATURE_GROUPS: FeatureGroupDef[] = [
  {
    id: 'intelligence',
    title: 'Advanced Intelligence',
    description: 'Mood, business insight, prediction, multi-modal reasoning.',
    items: [
      { id: 'fg_eq', label: 'Emotional intelligence', description: 'Mood detection and adaptation' },
      { id: 'fg_bi', label: 'Business intelligence', description: 'Reports and lead qualification' },
      { id: 'fg_pred', label: 'Predictive assistance', description: 'Anticipate needs from patterns' },
      { id: 'fg_multi', label: 'Multi-modal processing', description: 'Text, voice, vision inputs' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Capabilities',
    description: 'Code, automation, security, languages.',
    items: [
      { id: 'fg_code', label: 'Code generation', description: 'Write and debug software' },
      { id: 'fg_auto', label: 'Task automation', description: 'Custom workflows' },
      { id: 'fg_sec', label: 'Security monitoring', description: 'System protection' },
      { id: 'fg_i18n', label: 'Multi-language', description: 'Global communication' },
    ],
  },
  {
    id: 'connectivity',
    title: 'Connectivity',
    description: 'Email, calendar, web, APIs, social.',
    items: [
      { id: 'fg_email', label: 'Email integration', description: 'Inbox management' },
      { id: 'fg_cal', label: 'Calendar management', description: 'Scheduling and reminders' },
      { id: 'fg_scrape', label: 'Web scraping', description: 'Realtime research' },
      { id: 'fg_api', label: 'API integrations', description: 'Business tool connections' },
      { id: 'fg_social', label: 'Social monitoring', description: 'Brand tracking' },
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Files, backup, teams, compliance.',
    items: [
      { id: 'fg_files', label: 'File management', description: 'Digital organization' },
      { id: 'fg_backup', label: 'Backup automation', description: 'Data protection' },
      { id: 'fg_team', label: 'Multi-user support', description: 'Team collaboration' },
      { id: 'fg_comply', label: 'Compliance tools', description: 'Business regulations' },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile & Field',
    description: 'PWA, offline, push, glass UI — shared with this dashboard.',
    items: [
      { id: 'fg_pwa', label: 'PWA install', description: 'Native-like shell' },
      { id: 'fg_offline', label: 'Offline mode', description: 'Work without network' },
      { id: 'fg_push', label: 'Push alerts', description: 'Proactive notifications' },
      { id: 'fg_glass', label: 'Glassmorphism UI', description: 'Control room design system' },
    ],
  },
];
