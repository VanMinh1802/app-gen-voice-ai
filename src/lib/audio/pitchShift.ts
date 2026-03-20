/**
 * Pitch shift using Web Audio API playbackRate.
 * This changes pitch but also changes duration (speed).
 * For pitch-only change, we'd need a phase vocoder.
 *
 * For simplicity, this version just uses resampling to change pitch
 * and accepts that duration will change proportionally.
 * This is the simplest approach that gives correct pitch direction.
 *
 * semitones: -12 to +12 (0 = no change).
 * +12 = one octave up (shorter, higher), -12 = one octave down (longer, lower).
 */
export function pitchShift(
  audio: Float32Array,
  semitones: number,
): Float32Array {
  if (semitones === 0 || !Number.isFinite(semitones)) return audio;

  const semitonesClamped = Math.max(-12, Math.min(12, semitones));

  // +semitones = higher pitch = compress (ratio < 1 = fewer samples)
  // -semitones = lower pitch = expand (ratio > 1 = more samples)
  const ratio = 2 ** (-semitonesClamped / 12);

  const n = audio.length;
  const newLength = Math.floor(n * ratio);
  const out = new Float32Array(newLength);

  // Cubic interpolation for smoother resampling
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i / ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = i0 + 1;
    const i2 = i0 + 2;
    const i3 = i0 + 3;
    const t = srcIndex - i0;

    const s0 = i0 >= 0 && i0 < n ? audio[i0]! : 0;
    const s1 = i1 >= 0 && i1 < n ? audio[i1]! : 0;
    const s2 = i2 >= 0 && i2 < n ? audio[i2]! : 0;
    const s3 = i3 >= 0 && i3 < n ? audio[i3]! : 0;

    // Cubic interpolation
    out[i] = cubicInterpolate(s0, s1, s2, s3, t);
  }

  return out;
}

function cubicInterpolate(
  s0: number,
  s1: number,
  s2: number,
  s3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom spline
  return (
    0.5 *
    (2 * s1 +
      (-s0 + s2) * t +
      (2 * s0 - 5 * s1 + 4 * s2 - s3) * t2 +
      (-s0 + 3 * s1 - 3 * s2 + s3) * t3)
  );
}
