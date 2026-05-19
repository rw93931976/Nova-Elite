import React from 'react';
import { Activity, Brain, Mic, Power, Shield } from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import { MemoryWiringPanel } from '../components/MemoryWiringPanel';
import type { NovaStatus } from '../../types/nova';

interface HomePageProps {
  status: NovaStatus;
  version: string;
  isHalted: boolean;
  onToggleHalt: () => void;
  isLiveActive: boolean;
  isConnecting: boolean;
  onToggleVoice: () => void;
  messageCount: number;
  lastError?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  status,
  version,
  isHalted,
  onToggleHalt,
  isLiveActive,
  isConnecting,
  onToggleVoice,
  messageCount,
  lastError,
}) => (
  <div className="control-room-page">
    <header className="control-room-page__hero">
      <div>
        <p className="control-room-eyebrow">Nova Control Room</p>
        <h1 className="control-room-title">Sovereign Home</h1>
        <p className="control-room-version">{version}</p>
      </div>
      <div className="control-room-clock">
        <span className="control-room-eyebrow">Chronos</span>
        <strong>{status.currentTime ?? new Date().toLocaleString()}</strong>
      </div>
    </header>

    <MemoryWiringPanel />

    <div className="control-room-grid control-room-grid--home">
      <GlassPanel accent="cyan" title="Voice bridge" subtitle="Primary command surface">
        <div className="home-voice">
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={isConnecting}
            className={`home-voice__mic ${isLiveActive ? 'home-voice__mic--live' : ''}`}
            aria-label={isLiveActive ? 'Stop live voice' : 'Start live voice'}
          >
            <Mic size={32} />
          </button>
          <p className="home-voice__status">
            {isConnecting ? 'Connecting…' : isLiveActive ? 'Sovereign link active' : 'Tap to command'}
          </p>
          {lastError && <p className="home-voice__error">{lastError}</p>}
        </div>
      </GlassPanel>

      <GlassPanel accent="emerald" title="Autonomy stage" subtitle={`Level ${status.level} · Mother Brain`}>
        <div className="home-stat-grid">
          <Stat icon={<Brain size={20} />} label="Self-aware" value={status.isSelfAware ? 'Yes' : 'No'} />
          <Stat icon={<Activity size={20} />} label="Learning" value={status.isLearning ? 'Active' : 'Idle'} />
          <Stat icon={<Shield size={20} />} label="Agents" value={String(status.agentCount ?? 0)} />
          <Stat icon={<Activity size={20} />} label="Messages" value={String(messageCount)} />
        </div>
      </GlassPanel>

      <GlassPanel accent="rose" title="Master controls">
        <button
          type="button"
          onClick={onToggleHalt}
          className={`home-halt ${isHalted ? 'home-halt--active' : ''}`}
        >
          <Power size={22} />
          {isHalted ? 'Resume system' : 'Emergency halt'}
        </button>
        <p className="home-halt__note">Kill switch always armed. Read-only guardrails per live policy.</p>
      </GlassPanel>

      <GlassPanel accent="cyan" title="Infrastructure" subtitle="Live reference + memory path">
        <ul className="home-health">
          <li>
            <span>Bridge</span>
            <strong className={status.health?.bridge === 'online' ? 'text-emerald-400' : 'text-rose-400'}>
              {status.health?.bridge ?? 'unknown'}
            </strong>
          </li>
          <li>
            <span>Database</span>
            <strong className={status.health?.database === 'online' ? 'text-emerald-400' : 'text-amber-400'}>
              {status.health?.database ?? 'syncing'}
            </strong>
          </li>
          <li>
            <span>Uptime</span>
            <strong>{status.uptime ?? 0}s</strong>
          </li>
          <li>
            <span>Business hours</span>
            <strong>{status.isBusinessHours ? 'Yes' : 'No'}</strong>
          </li>
        </ul>
      </GlassPanel>
    </div>
  </div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="home-stat">
    <div className="home-stat__icon">{icon}</div>
    <div>
      <span className="home-stat__label">{label}</span>
      <strong className="home-stat__value">{value}</strong>
    </div>
  </div>
);
