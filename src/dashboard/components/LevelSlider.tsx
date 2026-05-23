import React from 'react';
import { MetricControl } from './MetricControl';

interface LevelSliderProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onValueSettled?: (value: number) => void;
}

export const LevelSlider: React.FC<LevelSliderProps> = props => (
  <MetricControl {...props} rangeClassName="nova-range" />
);
