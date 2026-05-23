import React from 'react';
import { Mic } from 'lucide-react';
import type { NovaStatus } from '../../types/nova';

interface HomePageProps {
  status: NovaStatus;
  version: string;
  isHalted: boolean;
  isLiveActive: boolean;
  isConnecting: boolean;
  isAgentSpeaking: boolean;
  onToggleVoice: () => void;
  lastError?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  status,
  version,
  isHalted,
  isLiveActive,
  isConnecting,
  isAgentSpeaking,
  onToggleVoice,
  lastError,
}) => {
  const voiceLabel = isConnecting
    ? 'Connecting…'
    : isLiveActive
      ? 'End voice session'
      : 'Start voice';

  const voiceHint = isHalted
    ? 'System is halted — resume in Settings before starting voice.'
    : isLiveActive
      ? 'LiveKit voice link is active.'
      : 'Primary command surface for Kate.';

  return (
    <div className="control-room-page control-room-page--home">
      <header className="home-entry__header">
        <p className="control-room-eyebrow">Control Room</p>
        <h1 className="control-room-title control-room-title--home">Kate</h1>
      </header>

      <section className="home-entry__main" aria-label="Kate voice access">
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isConnecting || isHalted}
          className={`home-entry__voice ${isLiveActive ? 'home-entry__voice--live' : ''} ${isAgentSpeaking ? 'home-entry__voice--speaking' : ''}`}
          aria-label={voiceLabel}
        >
          <span className="home-entry__voice-ring" aria-hidden />
          <Mic size={56} strokeWidth={1.75} className="home-entry__mic-icon" />
          <span className="home-entry__voice-label">{voiceLabel}</span>
        </button>
        <p className="home-entry__hint">{voiceHint}</p>
        {lastError && <p className="home-entry__error">{lastError}</p>}
      </section>

      <footer className="home-entry__footer home-entry__footer--desktop-only">
        <p className="home-entry__version-line">{version}</p>
        <div className="home-entry__stat">
          <span>Autonomy level</span>
          <strong>{status.level}</strong>
        </div>
        <div className="home-entry__stat">
          <span>Bridge</span>
          <strong className={status.health?.bridge === 'online' ? 'home-entry__ok' : 'home-entry__warn'}>
            {status.health?.bridge ?? 'unknown'}
          </strong>
        </div>
        <div className="home-entry__stat">
          <span>Local time</span>
          <strong>{status.currentTime ?? '—'}</strong>
        </div>
        {isHalted && (
          <p className="home-entry__halt-banner">Master kill switch is active.</p>
        )}
      </footer>
    </div>
  );
};
