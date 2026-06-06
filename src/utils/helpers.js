/**
 * helpers.js — utilitários gerais.
 */

/**
 * Seeded random number. Útil fora do ProceduralGen para consistência de seed.
 */
export function seededRandom(seed) {
  let s = seed
  return function() {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Clamp value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Linear interpolation.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Random integer between min and max (inclusive).
 */
export function randInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min
}

/**
 * Pick a random element from an array.
 */
export function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * Shuffle array (Fisher-Yates) with optional seeded rng.
 */
export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Format milliseconds as "1m 23s"
 */
export function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

/**
 * Hex color to Phaser-compatible integer.
 */
export function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16)
}
