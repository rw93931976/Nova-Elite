import React from 'react';
import { AlertTriangle, Power, RefreshCw, Volume2 } from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import { GlowSlider } from '../components/GlowSlider';
import { MemoryWiringPanel } from '../components/MemoryWiringPanel';
import type { NovaStatus } from '../../types/nova';
import type { SecondReviewState } from '../types';

interface SettingsPageProps {
  status: NovaStatus;
  version: string;
  isHalted: boolean;
  onToggleHalt: () => void;
  lastError?: string | null;
  secondReview: SecondReviewState;
  volume: number;
  onVolumeChange: (v: number) => void;
  onHardRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  status,
  version,
  isHalted,
  onToggleHalt,
  lastError,
  secondReview,
  volume,
  onVolumeChange,
  onHardRefresh,
}) => {
  const pendingReview =
    secondReview.updatedAt && !secondReview.finalApproved && secondReview.recommendation;

  return (
    <div className="control-room-page">
      <header className="control-room-page__hero">
        <div>
          <p className="control-room-eyebrow">Operations</p>
          <h1 className="control-room-title">Settings</h1>
          <p className="control-room-version">{version}</p>
        </div>
      </header>

      <div className="control-room-stack control-room-stack--settings">
        <GlassPanel accent="cyan" title="System status" subtitle="Infrastructure snapshot">
          <ul className="settings-status-list">
            <li>
              <span>Bridge</span>
              <strong className={status.health?.bridge === 'online' ? 'home-entry__ok' : 'home-entry__warn'}>
                {status.health?.bridge ?? 'unknown'}
              </strong>
            </li>
            <li>
              <span>Database</span>
              <strong className={status.health?.database === 'online' ? 'home-entry__ok' : 'home-entry__warn'}>
                {status.health?.database ?? 'syncing'}
              </strong>
            </li>
            <li>
              <span>Autonomy level</span>
              <strong>{status.level}</strong>
            </li>
            <li>
              <span>Agents</span>
              <strong>{status.agentCount ?? 0}</strong>
            </li>
            <li>
              <span>Uptime</span>
              <strong>{status.uptime ?? 0}s</strong>
            </li>
            <li>
              <span>Self-aware</span>
              <strong>{status.isSelfAware ? 'Yes' : 'No'}</strong>
            </li>
            <li>
              <span>Learning</span>
              <strong>{status.isLearning ? 'Active' : 'Idle'}</strong>
            </li>
            <li>
              <span>Business hours</span>
              <strong>{status.isBusinessHours ? 'Yes' : 'No'}</strong>
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel accent="amber" title="Alerts" subtitle="Voice and governance signals">
          <ul className="settings-alerts">
            {isHalted && (
              <li className="settings-alerts__item settings-alerts__item--critical">
                <AlertTriangle size={18} />
                <span>Master kill switch is active — all agents should be stopped.</span>
              </li>
            )}
            {lastError && (
              <li className="settings-alerts__item settings-alerts__item--warn">
                <AlertTriangle size={18} />
                <span>{lastError}</span>
              </li>
            )}
            {pendingReview && (
              <li className="settings-alerts__item">
                <AlertTriangle size={18} />
                <span>Second review pending: {secondReview.context}</span>
              </li>
            )}
            {!isHalted && !lastError && !pendingReview && (
              <li className="settings-alerts__item settings-alerts__item--ok">
                <span>No active alerts.</span>
              </li>
            )}
          </ul>
        </GlassPanel>

        <MemoryWiringPanel />

        <GlassPanel accent="rose" title="Master kill switch" subtitle="Stops Kate and spawned agents">
          <button
            type="button"
            onClick={onToggleHalt}
            className={`settings-kill ${isHalted ? 'settings-kill--active' : ''}`}
          >
            <Power size={24} />
            {isHalted ? 'Resume system' : 'Emergency halt'}
          </button>
          <p className="settings-kill__note">
            Ray remains final approver on major financial or structural choices. Downstream tiers carry
            their own kill switches per the Sovereign Autonomy Manifest.
          </p>
        </GlassPanel>

        <GlassPanel accent="emerald" title="Voice & maintenance" subtitle="Calibration and cache">
          <GlowSlider
            id="settings_volume"
            label="Output volume"
            value={Math.round(volume * 100)}
            onChange={v => onVolumeChange(v / 100)}
            touchAdjustable
          />
          <div className="settings-volume-icons">
            <Volume2 size={20} />
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <button type="button" className="settings-action-btn" onClick={onHardRefresh}>
            <RefreshCw size={20} />
            Nuclear cache clear
          </button>
        </GlassPanel>
      </div>
    </div>
  );
};
