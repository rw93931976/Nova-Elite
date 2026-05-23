import React, { useCallback } from 'react';
import { useCoarsePointer } from '../hooks/useCoarsePointer';

interface MetricControlProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  onValueSettled?: (value: number) => void;
  disabled?: boolean;
  /** Allow +/- adjustment on touch devices (e.g. volume). Default false = read-only on phone. */
  touchAdjustable?: boolean;
  readOnlyHint?: string;
  valueClassName?: string;
  valueStyle?: React.CSSProperties;
  trackStyle?: React.CSSProperties;
  rangeClassName?: string;
  rowClassName?: string;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export const MetricControl: React.FC<MetricControlProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  onValueSettled,
  disabled = false,
  touchAdjustable = false,
  readOnlyHint = 'System score — auto metrics when wired. Read-only on mobile.',
  valueClassName = 'nova-slider-row__value',
  valueStyle,
  trackStyle,
  rangeClassName = 'nova-range',
  rowClassName = 'nova-slider-row',
}) => {
  const coarse = useCoarsePointer();
  const pct = Math.round(value);
  const readOnly = coarse && !touchAdjustable;

  const bump = useCallback(
    (delta: number) => {
      const next = clamp(value + delta);
      onChange(next);
      onValueSettled?.(next);
    },
    [onChange, onValueSettled, value],
  );

  return (
    <div className={`${rowClassName} ${readOnly ? 'nova-slider-row--readonly' : ''}`}>
      <div className="nova-slider-row__meta">
        <label htmlFor={readOnly ? undefined : id} className="nova-slider-row__label">
          {label}
        </label>
        {description && <span className="nova-slider-row__desc">{description}</span>}
        {readOnly && <span className="nova-slider-row__readonly-hint">{readOnlyHint}</span>}
      </div>
      <div className="nova-slider-row__control">
        <span className={valueClassName} style={valueStyle} aria-live="polite">
          {pct}
        </span>
        {readOnly ? (
          <div
            className="nova-metric-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <div className="nova-metric-bar__fill" style={{ width: `${pct}%`, ...trackStyle }} />
          </div>
        ) : coarse && touchAdjustable ? (
          <div className="nova-metric-stepper">
            <button type="button" className="nova-metric-stepper__btn" disabled={disabled || pct <= 0} onClick={() => bump(-5)} aria-label={`Decrease ${label}`}>
              −
            </button>
            <div className="nova-metric-bar nova-metric-bar--stepper">
              <div className="nova-metric-bar__fill" style={{ width: `${pct}%`, ...trackStyle }} />
            </div>
            <button type="button" className="nova-metric-stepper__btn" disabled={disabled || pct >= 100} onClick={() => bump(5)} aria-label={`Increase ${label}`}>
              +
            </button>
          </div>
        ) : (
          <div className="nova-glow-track" style={trackStyle}>
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
              className={rangeClassName}
              style={{ '--pct': `${value}%` } as React.CSSProperties}
            />
          </div>
        )}
      </div>
    </div>
  );
};
