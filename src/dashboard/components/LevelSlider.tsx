import React from 'react';

interface LevelSliderProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onValueSettled?: (value: number) => void;
}

export const LevelSlider: React.FC<LevelSliderProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false,
  onValueSettled,
}) => (
  <div className="nova-slider-row">
    <div className="nova-slider-row__meta">
      <label htmlFor={id} className="nova-slider-row__label">
        {label}
      </label>
      {description && <span className="nova-slider-row__desc">{description}</span>}
    </div>
    <div className="nova-slider-row__control">
      <span className="nova-slider-row__value" aria-live="polite">
        {Math.round(value)}%
      </span>
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
        className="nova-range"
      />
    </div>
  </div>
);
