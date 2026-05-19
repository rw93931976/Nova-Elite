import React from 'react';
import { AUTONOMY_LEVELS, AUTONOMY_SOURCE, EMERGING_CAPABILITIES } from '../data/autonomyLevels';
import { GlassPanel } from '../components/GlassPanel';
import { GlowSlider } from '../components/GlowSlider';

interface AutonomyPageProps {
  autonomyProgress: Record<string, number>;
  itemProgress: Record<string, number>;
  onLevelChange: (level: number, value: number, emitReview?: boolean) => void;
  onItemChange: (itemId: string, value: number, reviewLabel?: string, emitReview?: boolean) => void;
}

export const AutonomyPage: React.FC<AutonomyPageProps> = ({
  autonomyProgress,
  itemProgress,
  onLevelChange,
  onItemChange,
}) => (
  <div className="control-room-page">
    <header className="control-room-page__hero">
      <div>
        <p className="control-room-eyebrow">Sovereign agency</p>
        <h1 className="control-room-title">Autonomy 0–10</h1>
        <p className="control-room-version">Source of truth: {AUTONOMY_SOURCE}</p>
      </div>
    </header>

    <div className="control-room-stack">
      {AUTONOMY_LEVELS.map(level => {
        const levelKey = `level_${level.level}`;
        const levelValue = autonomyProgress[levelKey] ?? level.defaultProgress;
        return (
          <GlassPanel
            key={level.level}
            accent="cyan"
            title={`Level ${level.level} — ${level.title}`}
            subtitle={level.summary}
          >
            <GlowSlider
              id={levelKey}
              label="Stage readiness (0–100)"
              value={levelValue}
              onChange={v => onLevelChange(level.level, v, false)}
              onValueSettled={v => onLevelChange(level.level, v, true)}
            />
            <div className="level-items">
              {level.items.map(item => (
                <GlowSlider
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  value={itemProgress[item.id] ?? levelValue}
                  onChange={v => onItemChange(item.id, v, item.label, false)}
                  onValueSettled={v => onItemChange(item.id, v, item.label, true)}
                />
              ))}
            </div>
          </GlassPanel>
        );
      })}

      <GlassPanel accent="amber" title="Emerging capabilities (AGI / ASI)" subtitle="Not leveled — reference only">
        <ul className="emerging-list">
          {EMERGING_CAPABILITIES.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  </div>
);
