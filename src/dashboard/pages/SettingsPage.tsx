import React from 'react';
import { MapPin, RefreshCw, Settings, Volume2 } from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import { LevelSlider } from '../components/LevelSlider';
import { NotebookWritingPlaceholder } from '../components/NotebookWritingPlaceholder';
import type { NotebookWritingCapability } from '../types';

interface SettingsPageProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  onHardRefresh: () => void;
  notebookWriting: NotebookWritingCapability;
  onNotebookLog: (subject: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  volume,
  onVolumeChange,
  onHardRefresh,
  notebookWriting,
  onNotebookLog,
}) => (
  <div className="control-room-page">
    <header className="control-room-page__hero">
      <div>
        <p className="control-room-eyebrow">Control room</p>
        <h1 className="control-room-title">Settings</h1>
        <p className="control-room-version">Operations, voice, future field tools</p>
      </div>
    </header>

    <div className="control-room-grid">
      <GlassPanel accent="cyan" title="Voice calibration" subtitle="Drive-time output level">
        <LevelSlider
          id="settings_volume"
          label="Output volume"
          value={Math.round(volume * 100)}
          onChange={v => onVolumeChange(v / 100)}
        />
        <div className="settings-volume-icons">
          <Volume2 size={20} />
          <span>{Math.round(volume * 100)}%</span>
        </div>
      </GlassPanel>

      <GlassPanel accent="amber" title="Location & operations" subtitle="Reserved — not wired">
        <div className="settings-disabled-block">
          <MapPin size={24} />
          <p>GPS and field operations will live here for drive-time and client proximity workflows.</p>
          <span className="settings-flag">locationOpsEnabled = false</span>
        </div>
        <LevelSlider
          id="settings_location_placeholder"
          label="Location readiness (placeholder)"
          value={0}
          onChange={() => {}}
          disabled
        />
      </GlassPanel>

      <GlassPanel accent="emerald" title="System maintenance">
        <button type="button" className="settings-action-btn" onClick={onHardRefresh}>
          <RefreshCw size={20} />
          Nuclear cache clear
        </button>
        <button type="button" className="settings-action-btn settings-action-btn--ghost" onClick={() => window.location.reload()}>
          <Settings size={20} />
          Hard refresh UI
        </button>
      </GlassPanel>
    </div>

    <NotebookWritingPlaceholder capability={notebookWriting} onSimulateRequest={onNotebookLog} />
  </div>
);
