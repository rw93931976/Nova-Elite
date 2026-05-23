import React from 'react';
import { FEATURE_GROUPS } from '../data/featureGroups';
import { GlassPanel } from '../components/GlassPanel';
import { GlowSlider } from '../components/GlowSlider';

interface FeatureGroupsPageProps {
  featureProgress: Record<string, number>;
  itemProgress: Record<string, number>;
  onGroupChange: (groupId: string, value: number, emitReview?: boolean) => void;
  onItemChange: (itemId: string, value: number, reviewLabel?: string, emitReview?: boolean) => void;
}

export const FeatureGroupsPage: React.FC<FeatureGroupsPageProps> = ({
  featureProgress,
  itemProgress,
  onGroupChange,
  onItemChange,
}) => (
  <div className="control-room-page">
    <header className="control-room-page__hero">
      <div>
        <p className="control-room-eyebrow">Capability map</p>
        <h1 className="control-room-title">Features</h1>
        <p className="control-room-version">Guideline: NOVA_ADVANCED_FEATURES — activation 0–100</p>
      </div>
    </header>

    <div className="control-room-stack">
      {FEATURE_GROUPS.map(group => {
        const groupValue = featureProgress[group.id] ?? 30;
        return (
          <GlassPanel
            key={group.id}
            accent="emerald"
            title={group.title}
            subtitle={group.description}
          >
            <GlowSlider
              id={`fg_${group.id}`}
              label="Group activation (0–100)"
              value={groupValue}
              onChange={v => onGroupChange(group.id, v, false)}
              onValueSettled={v => onGroupChange(group.id, v, true)}
            />
            <div className="level-items">
              {group.items.map(item => (
                <GlowSlider
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  description={item.description}
                  value={itemProgress[item.id] ?? groupValue}
                  onChange={v => onItemChange(item.id, v, item.label, false)}
                  onValueSettled={v => onItemChange(item.id, v, item.label, true)}
                />
              ))}
            </div>
          </GlassPanel>
        );
      })}
    </div>
  </div>
);
