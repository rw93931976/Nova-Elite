/** Four-page desktop control room + study */
export type DashboardPageId = 'home' | 'study' | 'autonomy' | 'features' | 'settings';

export const DASHBOARD_SECTIONS: readonly { id: DashboardPageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'study', label: 'Study' },
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'features', label: 'Features' },
  { id: 'settings', label: 'Settings' },
] as const;

export interface DashboardSubItem {
  id: string;
  label: string;
  description?: string;
}

export interface AutonomyLevelDef {
  level: number;
  title: string;
  summary: string;
  items: DashboardSubItem[];
  defaultProgress: number;
}

export interface FeatureGroupDef {
  id: string;
  title: string;
  description: string;
  items: DashboardSubItem[];
}

export interface StudyTrackDef {
  id: string;
  title: string;
  module: string;
  subjects: string[];
  isEmotional?: boolean;
}

export interface NotebookWritingCapability {
  enabled: false;
  status: 'disabled' | 'planned';
  description: string;
  log: NotebookWritingLogEntry[];
}

export interface NotebookWritingLogEntry {
  at: string;
  message: string;
}

export interface SecondReviewState {
  context: string;
  recommendation: string;
  acknowledged: boolean;
  finalApproved: boolean;
  updatedAt: string | null;
}

export interface DashboardPersistedState {
  autonomyProgress: Record<string, number>;
  featureProgress: Record<string, number>;
  itemProgress: Record<string, number>;
  notebookWriting: NotebookWritingCapability;
  locationOpsEnabled: false;
  secondReview: SecondReviewState;
}
