import { useCallback, useEffect, useState } from 'react';

export interface SsuTrackSummary {
  done: number;
  total: number;
  remaining?: number;
}

export interface SsuProgressSummary {
  business: SsuTrackSummary;
  search: SsuTrackSummary;
  emotion: SsuTrackSummary;
}

export interface SsuStudyEntry {
  subject: string;
  type: string;
  slot?: string;
  spaces_key: string;
  completed_at: string;
}

export interface SsuBreadcrumbEntry {
  subject: string;
  type: string;
  spaces_key: string;
  folder: string;
  snippet: string;
  studied_at: string;
}

export interface SsuDashboardSnapshot {
  progress: {
    completed: SsuStudyEntry[];
    summary?: SsuProgressSummary;
    updated_at?: string;
  } | null;
  breadcrumbs: {
    entries: SsuBreadcrumbEntry[];
    updated_at?: string;
  } | null;
  synced_at?: string | null;
  snapshot_at?: string | null;
}

const SSU_PROGRESS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ssu-progress`;

export function useStudyProgress(pollMs = 60_000) {
  const [snapshot, setSnapshot] = useState<SsuDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!import.meta.env.VITE_SUPABASE_URL || !anonKey) {
      setError('Supabase env not configured');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(SSU_PROGRESS_URL, {
        headers: { Authorization: `Bearer ${anonKey}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as SsuDashboardSnapshot;
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load study progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(timer);
  }, [refresh, pollMs]);

  return { snapshot, loading, error, refresh };
}
