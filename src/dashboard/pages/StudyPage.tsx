import React, { useState } from 'react';
import { Heart, BookOpen } from 'lucide-react';
import {
  STUDY_SOURCES,
  SYLLABUS_META,
  SYLLABUS_MODULES,
  SYLLABUS_SOURCE,
  SYLLABUS_SUBJECT_COUNT,
  SYLLABUS_VERSION,
} from '../data/studySyllabus';
import { GlassPanel } from '../components/GlassPanel';
import { LevelSlider } from '../components/LevelSlider';
import { NotebookWritingPlaceholder } from '../components/NotebookWritingPlaceholder';
import { StudyLiveScorecard } from '../components/StudyLiveScorecard';
import { useStudyProgress } from '../hooks/useStudyProgress';
import type { NotebookWritingCapability, StudyTrackDef } from '../types';

interface StudyPageProps {
  itemProgress: Record<string, number>;
  onItemChange: (itemId: string, value: number, reviewLabel?: string, emitReview?: boolean) => void;
  notebookWriting: NotebookWritingCapability;
  onNotebookLog: (subject: string) => void;
}

export const StudyPage: React.FC<StudyPageProps> = ({
  itemProgress,
  onItemChange,
  notebookWriting,
  onNotebookLog,
}) => {
  const [draftSubject, setDraftSubject] = useState('');
  const { snapshot, loading, error, refresh } = useStudyProgress();

  const emotional = SYLLABUS_MODULES.filter(t => t.isEmotional);
  const academic = SYLLABUS_MODULES.filter(t => !t.isEmotional);

  return (
    <div className="control-room-page">
      <header className="control-room-page__hero">
        <div>
          <p className="control-room-eyebrow">Doctorate track</p>
          <h1 className="control-room-title">Syllabus & study</h1>
          <p className="control-room-version">
            {SYLLABUS_SOURCE} {SYLLABUS_VERSION} · {SYLLABUS_SUBJECT_COUNT} subjects · live scorecard from Spaces
          </p>
        </div>
      </header>

      <GlassPanel accent="cyan" title="Autonomous schooling" subtitle="Mirrored from DO Spaces via Supabase">
        <StudyLiveScorecard
          snapshot={snapshot}
          loading={loading}
          error={error}
          onRefresh={() => void refresh()}
        />
      </GlassPanel>

      <GlassPanel accent="cyan" title={SYLLABUS_META.project} subtitle={SYLLABUS_META.status}>
        <dl className="syllabus-meta">
          <div>
            <dt>Dual-study</dt>
            <dd>{SYLLABUS_META.dualStudy}</dd>
          </div>
          <div>
            <dt>Cron intervals</dt>
            <dd>{SYLLABUS_META.intervals}</dd>
          </div>
        </dl>
      </GlassPanel>

      <NotebookWritingPlaceholder capability={notebookWriting} onSimulateRequest={onNotebookLog} />

      <GlassPanel accent="rose" title="Emotional learning" subtitle="Module 6 — sliders are UI-only (no backend EQ wire)">
        <div className="study-eq-banner">
          <Heart size={28} className="text-rose-400" />
          <p>
            EQ mastery is tracked here for planning only. Live empathy remains voice/runtime paths—not
            promoted from these sliders alone.
          </p>
        </div>
        <div className="control-room-stack study-tracks">
          {emotional.map(track => (
            <StudyTrackCard
              key={track.id}
              track={track}
              itemProgress={itemProgress}
              onItemChange={onItemChange}
              highlight
            />
          ))}
        </div>
      </GlassPanel>

      <GlassPanel accent="cyan" title="Academic modules" subtitle={`From ${SYLLABUS_SOURCE}`}>
        <div className="control-room-stack study-tracks">
          {academic.map(track => (
            <StudyTrackCard
              key={track.id}
              track={track}
              itemProgress={itemProgress}
              onItemChange={onItemChange}
            />
          ))}
        </div>
      </GlassPanel>

      <GlassPanel accent="amber" title="Source pointers">
        <ul className="study-sources">
          {STUDY_SOURCES.map(s => (
            <li key={s.path}>
              <BookOpen size={14} />
              <span>{s.label}</span>
              <code>{s.path}</code>
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel accent="cyan" title="Queue next study (placeholder)">
        <input
          className="study-draft-input"
          placeholder="Subject for next cycle…"
          value={draftSubject}
          onChange={e => setDraftSubject(e.target.value)}
        />
        <button
          type="button"
          className="notebook-cap__btn notebook-cap__btn--ghost"
          onClick={() => {
            if (draftSubject.trim()) onNotebookLog(draftSubject.trim());
          }}
        >
          Log study intent (notebook write still disabled)
        </button>
      </GlassPanel>
    </div>
  );
};

const StudyTrackCard: React.FC<{
  track: StudyTrackDef;
  itemProgress: Record<string, number>;
  onItemChange: (id: string, v: number, label?: string) => void;
  highlight?: boolean;
}> = ({ track, itemProgress, onItemChange, highlight }) => (
  <article className={`study-track ${highlight ? 'study-track--eq' : ''}`}>
    <div className="study-track__head">
      <span className="study-track__module">{track.module}</span>
      <h4>{track.title}</h4>
    </div>
    <ul className="study-track__subjects">
      {track.subjects.map((s, i) => {
        const id = `${track.id}_${i}`;
        return (
          <li key={id}>
            <span>{s}</span>
            <LevelSlider
              id={id}
              label="UI mastery (planning)"
              value={itemProgress[id] ?? 20}
              onChange={v => onItemChange(id, v, s, false)}
              onValueSettled={v => onItemChange(id, v, s, true)}
            />
          </li>
        );
      })}
    </ul>
  </article>
);
