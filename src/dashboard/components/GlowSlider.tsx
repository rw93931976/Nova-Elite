import React, { useMemo } from 'react';
import { spectrumColor, spectrumGradient } from '../utils/sliderSpectrum';
import { MetricControl } from './MetricControl';

interface GlowSliderProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onValueSettled?: (value: number) => void;
  touchAdjustable?: boolean;
}

export const GlowSlider: React.FC<GlowSliderProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false,
  onValueSettled,
  touchAdjustable = false,
}) => {
  const { rgb, glow } = useMemo(() => spectrumColor(value), [value]);
  const trackBg = useMemo(() => spectrumGradient(value), [value]);

  return (
    <MetricControl
      id={id}
      label={label}
      description={description}
      value={value}
      onChange={onChange}
      onValueSettled={onValueSettled}
      disabled={disabled}
      touchAdjustable={touchAdjustable}
      rowClassName="nova-slider-row nova-slider-row--glow"
      valueClassName="nova-slider-row__value nova-slider-row__value--glow"
      valueStyle={{ color: rgb, textShadow: glow }}
      trackStyle={{ background: trackBg }}
      rangeClassName="nova-range nova-range--glow"
    />
  );
};
