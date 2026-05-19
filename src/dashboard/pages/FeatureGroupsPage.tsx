import React from 'react';
import { FEATURE_GROUPS } from '../data/featureGroups';
import { GlassPanel } from '../components/GlassPanel';
import { LevelSlider } from '../components/LevelSlider';

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
        <p className="control-room-eyebrow">Systems map</p>
        <h1 className="control-room-title">Feature groups</h1>
        <p className="control-room-version">Source: NOVA_ADVANCED_FEATURES (guidelines)</p>
      </div>
    </header>

    <div className="control-room-grid">
      {FEATURE_GROUPS.map(group => {
        const groupValue = featureProgress[group.id] ?? 30;
        return (
          <GlassPanel
            key={group.id}
            accent="emerald"
            title={group.title}
            subtitle={group.description}
          >
            <LevelSlider
              id={`fg_${group.id}`}
              label="Group activation"
              value={groupValue}
              onChange={v => onGroupChange(group.id, v, false)}
              onValueSettled={v => onGroupChange(group.id, v, true)}
            />
            <div className="level-items">
              {group.items.map(item => (
                <LevelSlider
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
