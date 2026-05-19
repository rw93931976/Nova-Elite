import React from 'react';
import { BookMarked, Lock } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import type { NotebookWritingCapability } from '../types';

interface NotebookWritingPlaceholderProps {
  capability: NotebookWritingCapability;
  onSimulateRequest?: (subject: string) => void;
}

export const NotebookWritingPlaceholder: React.FC<NotebookWritingPlaceholderProps> = ({
  capability,
  onSimulateRequest,
}) => (
  <GlassPanel
    accent="amber"
    title="Autonomous Notebook Authoring"
    subtitle="Registered capability — implementation disabled"
  >
    <div className="notebook-cap">
      <div className="notebook-cap__badge">
        <Lock size={16} />
        <span>FLAG: notebookWriting.enabled = false</span>
      </div>
      <p className="notebook-cap__desc">{capability.description}</p>
      <div className="notebook-cap__flow" aria-label="Planned notebook flow">
        <span className="notebook-cap__step">1 · Study</span>
        <span className="notebook-cap__arrow">→</span>
        <span className="notebook-cap__step">2 · Write Nova version</span>
        <span className="notebook-cap__arrow">→</span>
        <span className="notebook-cap__step">3 · File or create notebook</span>
      </div>
      <ol className="notebook-cap__steps">
        <li>Study assigned subject (business and/or emotional track)</li>
        <li>Write Nova&apos;s synthesized version</li>
        <li>File into the correct notebook, or create a new notebook if none exists</li>
      </ol>
      <button
        type="button"
        className="notebook-cap__btn"
        disabled
        title="Capability disabled — logs intent only"
        onClick={() => onSimulateRequest?.('Sample subject')}
      >
        <BookMarked size={18} />
        Write to notebook (disabled)
      </button>
      <button
        type="button"
        className="notebook-cap__btn notebook-cap__btn--ghost"
        onClick={() => onSimulateRequest?.('Manual log test')}
      >
        Log placeholder request
      </button>
      <div className="notebook-cap__log">
        <h4>Capability log</h4>
        <ul>
          {capability.log.slice(0, 8).map((entry, i) => (
            <li key={`${entry.at}-${i}`}>
              <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
              <span>{entry.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </GlassPanel>
);
