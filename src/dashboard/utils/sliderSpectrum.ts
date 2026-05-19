/** UI-matched spectrum: slate → aqua → emerald → amber → magenta (0–100) */

export interface SpectrumColor {
  rgb: string;
  glow: string;
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function mix(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}

const STOPS: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [71, 85, 105] },
  { at: 0.22, rgb: [11, 249, 234] },
  { at: 0.48, rgb: [52, 211, 153] },
  { at: 0.72, rgb: [251, 191, 36] },
  { at: 1, rgb: [244, 114, 182] },
];

export function spectrumColor(percent: number): SpectrumColor {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  let i = 0;
  while (i < STOPS.length - 1 && p > STOPS[i + 1].at) i++;
  const a = STOPS[i];
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)];
  const span = b.at - a.at || 1;
  const t = (p - a.at) / span;
  const [r, g, bl] = mix(a.rgb, b.rgb, t);
  const rgb = `rgb(${r}, ${g}, ${bl})`;
  return {
    rgb,
    glow: `0 0 16px ${rgb}, 0 0 32px rgba(${r}, ${g}, ${bl}, 0.35)`,
  };
}

export function spectrumGradient(percent: number): string {
  const mid = spectrumColor(percent);
  const low = spectrumColor(Math.max(0, percent - 15));
  return `linear-gradient(90deg, ${low.rgb} 0%, ${mid.rgb} ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.06) 100%)`;
}
