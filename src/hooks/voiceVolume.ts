/**
 * Slider maps to Web Audio gain (can exceed 1.0 — louder than browser nominal).
 * 35% UI ≈ 1.0× normal. 100% UI = VOLUME_MAX_GAIN (car boost).
 */
export const VOLUME_UI_DEFAULT = 0.35;
export const VOLUME_UI_UNITY = 0.35;
export const VOLUME_MAX_GAIN = 3.5;

export function uiVolumeToGain(ui: number): number {
  const clamped = Math.max(0, Math.min(1, ui));
  if (clamped <= 0) return 0;
  if (clamped <= VOLUME_UI_UNITY) {
    return clamped / VOLUME_UI_UNITY;
  }
  const t = (clamped - VOLUME_UI_UNITY) / (1 - VOLUME_UI_UNITY);
  return 1 + t * (VOLUME_MAX_GAIN - 1);
}

/** Fallback when Web Audio boost unavailable — cap at HTML max 1.0. */
export function uiVolumeToElementVolume(ui: number): number {
  return Math.min(1, uiVolumeToGain(ui));
}

export function readStoredUiVolume(): number {
  const raw = localStorage.getItem('nova_voice_volume');
  if (!raw) return VOLUME_UI_DEFAULT;
  const saved = parseFloat(raw);
  if (Number.isNaN(saved)) return VOLUME_UI_DEFAULT;
  return Math.max(0, Math.min(1, saved));
}
