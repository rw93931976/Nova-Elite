import React, { useMemo } from 'react';
import { spectrumColor, spectrumGradient } from '../utils/sliderSpectrum';

interface GlowSliderProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onValueSettled?: (value: number) => void;
}

export const GlowSlider: React.FC<GlowSliderProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false,
  onValueSettled,
}) => {
  const pct = Math.round(value);
  const { rgb, glow } = useMemo(() => spectrumColor(value), [value]);
  const trackBg = useMemo(() => spectrumGradient(value), [value]);

  return (
    <div className="nova-slider-row nova-slider-row--glow">
      <div className="nova-slider-row__meta">
        <label htmlFor={id} className="nova-slider-row__label">
          {label}
        </label>
        {description && <span className="nova-slider-row__desc">{description}</span>}
      </div>
      <div className="nova-slider-row__control">
        <span
          className="nova-slider-row__value nova-slider-row__value--glow"
          style={{ color: rgb, textShadow: glow }}
        >
          {pct}
        </span>
        <div
          className="nova-glow-track"
          style={
            {
              background: trackBg,
              '--thumb-color': rgb,
              '--thumb-glow': glow,
            } as React.CSSProperties
          }
        >
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            disabled={disabled}
            onChange={e => onChange(Number(e.target.value))}
            onMouseUp={e => onValueSettled?.(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={e => onValueSettled?.(Number((e.target as HTMLInputElement).value))}
            className="nova-range nova-range--glow"
            style={
              {
                '--pct': `${value}%`,
                '--thumb-color': rgb,
                '--thumb-glow': glow,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
};
