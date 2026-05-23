import React from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import type { SsuDashboardSnapshot } from '../hooks/useStudyProgress';

interface StudyLiveScorecardProps {
  snapshot: SsuDashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function pct(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const StudyLiveScorecard: React.FC<StudyLiveScorecardProps> = ({
  snapshot,
  loading,
  error,
  onRefresh,
}) => {
  const summary = snapshot?.progress?.summary;
  const recent = [...(snapshot?.breadcrumbs?.entries ?? [])]
    .sort((a, b) => new Date(b.studied_at).getTime() - new Date(a.studied_at).getTime())
    .slice(0, 5);

  return (
    <section className="study-live" aria-live="polite">
      <div className="study-live__head">
        <div>
          <p className="control-room-eyebrow">Live from Spaces</p>
          <h2 className="study-live__title">SSU scorecard</h2>
          <p className="study-live__meta">
            <Cloud size={14} />
            <span>
              {snapshot?.synced_at || snapshot?.snapshot_at
                ? `Synced ${formatWhen(snapshot.synced_at ?? snapshot.snapshot_at)}`
                : 'Waiting for first sync from droplet'}
            </span>
          </p>
        </div>
        <button type="button" className="study-live__refresh" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'study-live__spin' : undefined} />
          Refresh
        </button>
      </div>

      {error && <p className="study-live__error">{error}</p>}

      <div className="study-live__tracks">
        <TrackBar
          label="Business (noon)"
          done={summary?.business?.done ?? 0}
          total={summary?.business?.total ?? 107}
          accent="cyan"
        />
        <TrackBar
          label="AEO / SEO (3 PM)"
          done={summary?.search?.done ?? 0}
          total={summary?.search?.total ?? 37}
          accent="amber"
        />
        <TrackBar
          label="Emotional (EQ rotation)"
          done={summary?.emotion?.done ?? 0}
          total={summary?.emotion?.total ?? 6}
          accent="rose"
        />
      </div>

      {recent.length > 0 && (
        <ul className="study-live__recent">
          {recent.map(entry => (
            <li key={`${entry.type}-${entry.subject}`}>
              <span className="study-live__badge">{entry.type}</span>
              <strong>{entry.subject}</strong>
              <span className="study-live__path">{entry.spaces_key}</span>
              {entry.snippet && <p>{entry.snippet}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const TrackBar: React.FC<{
  label: string;
  done: number;
  total: number;
  accent: 'cyan' | 'amber' | 'rose';
}> = ({ label, done, total, accent }) => {
  const percent = pct(done, total);
  return (
    <div className={`study-live__track study-live__track--${accent}`}>
      <div className="study-live__track-head">
        <span>{label}</span>
        <span>
          {done}/{total} · {percent}%
        </span>
      </div>
      <div className="study-live__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="study-live__bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
