/**
 * Astrophysics utilities: spectral color mapping, visual star sizing,
 * B-V color index interpolation, and temperature estimates.
 */

// ---------------------------------------------------------------------------
// Spectral class → color (continuous B-V interpolation)
// ---------------------------------------------------------------------------

/** B-V color index reference points for each spectral sub-type. */
const BV_TABLE: Array<{ spectral: string; bv: number }> = [
  // O stars
  { spectral: 'O5', bv: -0.33 },
  { spectral: 'O9', bv: -0.31 },
  // B stars
  { spectral: 'B0', bv: -0.30 },
  { spectral: 'B5', bv: -0.17 },
  { spectral: 'B9', bv: -0.07 },
  // A stars
  { spectral: 'A0', bv: -0.02 },
  { spectral: 'A5', bv: 0.15 },
  // F stars
  { spectral: 'F0', bv: 0.30 },
  { spectral: 'F5', bv: 0.44 },
  // G stars (Sun is G2, B-V = 0.656)
  { spectral: 'G0', bv: 0.58 },
  { spectral: 'G2', bv: 0.656 },
  { spectral: 'G5', bv: 0.68 },
  // K stars
  { spectral: 'K0', bv: 0.81 },
  { spectral: 'K5', bv: 1.15 },
  // M stars
  { spectral: 'M0', bv: 1.40 },
  { spectral: 'M5', bv: 1.64 },
  { spectral: 'M9', bv: 2.00 },
  // L, T, Y (brown dwarfs — extrapolated)
  { spectral: 'L0', bv: 2.10 },
  { spectral: 'L5', bv: 2.50 },
  { spectral: 'T0', bv: 2.80 },
  { spectral: 'T5', bv: 3.20 },
  { spectral: 'Y0', bv: 3.50 },
]

/**
 * Convert B-V color index to RGB using Ballesteros' formula (2012).
 * Converts B-V → effective temperature → Planck-based RGB.
 * Returns [r, g, b] in 0–1 range.
 */
/** Saturation boost factor for visual distinction between spectral types. */
const SATURATION_BOOST = 1.8

export function bvToRgb(bv: number): [number, number, number] {
  // Clamp B-V to valid range
  const clamped = Math.max(-0.4, Math.min(bv, 3.5))

  // Ballesteros (2012) B-V → T_eff
  const temp = 4600 * (1 / (0.92 * clamped + 1.7) + 1 / (0.92 * clamped + 0.62))

  // Planck-based color, then boost saturation for visual clarity
  const [r, g, b] = temperatureToRgb(temp)
  return boostSaturation(r, g, b)
}

/** Boost saturation by pulling channels away from their luminance. */
function boostSaturation(
  r: number, g: number, b: number,
): [number, number, number] {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return [
    Math.max(0, Math.min(1, lum + (r - lum) * SATURATION_BOOST)),
    Math.max(0, Math.min(1, lum + (g - lum) * SATURATION_BOOST)),
    Math.max(0, Math.min(1, lum + (b - lum) * SATURATION_BOOST)),
  ]
}

/**
 * Convert effective temperature (K) to RGB using CIE-based approximation.
 * Based on Charity's color temperature table with smooth interpolation.
 */
function temperatureToRgb(tempK: number): [number, number, number] {
  // Guard against invalid temperatures
  if (!Number.isFinite(tempK) || tempK <= 0) return [1, 0.5, 0.2]

  const t = tempK / 100

  let r: number
  let g: number
  let b: number

  // Red channel
  if (t <= 66) {
    r = 1
  } else {
    // t > 66 guarantees t - 60 > 6 (positive base)
    r = 1.2929 * Math.pow(t - 60, -0.1332)
  }

  // Green channel
  if (t <= 66) {
    // Guard: log requires t > 0 (guaranteed by tempK > 0 check above)
    g = t > 0 ? 0.3901 * Math.log(t) - 0.6318 : 0
  } else {
    g = 1.1298 * Math.pow(t - 60, -0.0755)
  }

  // Blue channel
  if (t >= 66) {
    b = 1
  } else if (t <= 19) {
    b = 0
  } else {
    // t > 19 guarantees t - 10 > 9 (positive base for log)
    b = 0.5432 * Math.log(t - 10) - 1.1962
  }

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ]
}

/**
 * Convert B-V color index to a hex color number (0xRRGGBB).
 */
export function bvToHex(bv: number): number {
  const [r, g, b] = bvToRgb(bv)
  const ri = Math.round(r * 255)
  const gi = Math.round(g * 255)
  const bi = Math.round(b * 255)
  return (ri << 16) | (gi << 8) | bi
}

/**
 * Estimate B-V color index from spectral type string (e.g., "M3.5V", "G2V", "K5").
 * Parses the letter class and numeric subtype, then interpolates in BV_TABLE.
 */
export function spectralToBv(spectral: string): number {
  if (!spectral || spectral.length === 0) return 1.5 // default to mid-M

  const letter = spectral.charAt(0).toUpperCase()
  const subMatch = spectral.match(/^[OBAFGKMLTY](\d+\.?\d*)/)
  const subType = subMatch ? parseFloat(subMatch[1]!) : 5

  // Build lookup key
  const key = `${letter}${Math.round(subType)}`

  // Try exact match
  const exact = BV_TABLE.find((e) => e.spectral === key)
  if (exact) return exact.bv

  // Find bracketing entries for this letter class
  const classEntries = BV_TABLE.filter((e) => e.spectral.charAt(0) === letter)
  if (classEntries.length === 0) {
    // Unknown class — return defaults by letter
    const FALLBACK_BV: Record<string, number> = {
      O: -0.32, B: -0.17, A: 0.07, F: 0.37,
      G: 0.65, K: 0.98, M: 1.52, L: 2.30,
      T: 3.00, Y: 3.50, D: 0.00, W: -0.30,
    }
    return FALLBACK_BV[letter] ?? 1.5
  }

  if (classEntries.length === 1) return classEntries[0]!.bv

  // Parse numeric sub-type from each entry and interpolate
  const parsed = classEntries.map((e) => ({
    sub: parseFloat(e.spectral.slice(1)),
    bv: e.bv,
  }))

  const first = parsed[0]!
  const last = parsed[parsed.length - 1]!

  // Clamp to range
  if (subType <= first.sub) return first.bv
  if (subType >= last.sub) return last.bv

  // Linear interpolation between bracketing entries
  for (let i = 0; i < parsed.length - 1; i++) {
    const lo = parsed[i]!
    const hi = parsed[i + 1]!
    if (subType >= lo.sub && subType <= hi.sub) {
      const t = (subType - lo.sub) / (hi.sub - lo.sub)
      return lo.bv + t * (hi.bv - lo.bv)
    }
  }

  return first.bv
}

/**
 * Spectral type string → hex color number.
 * Convenience wrapper: spectral → B-V → hex.
 */
export function spectralToHex(spectral: string): number {
  return bvToHex(spectralToBv(spectral))
}

// ---------------------------------------------------------------------------
// Star visual radius from absolute magnitude
// ---------------------------------------------------------------------------

/** Sun's absolute visual magnitude */
const SUN_ABS_MAG = 4.83

/** Base visual radius in parsec-scale scene units */
const BASE_RADIUS = 0.03

/** Min/max clamp for visual radius */
const MIN_RADIUS = 0.008
const MAX_RADIUS = 0.12

/**
 * Calculate visual sphere radius for a star based on its absolute magnitude.
 * Uses logarithmic scaling: brighter stars (lower Mv) → larger spheres.
 *
 * The formula maps magnitude difference from the Sun to a log scale:
 *   radius = BASE * 10^(-0.2 * (Mv - Mv_sun))
 *
 * This gives roughly:
 *   Mv = -1  → radius ≈ 0.35 (giant star)
 *   Mv = 4.8 → radius ≈ 0.06 (Sun-like)
 *   Mv = 10  → radius ≈ 0.02 (dim red dwarf)
 *   Mv = 16  → radius ≈ 0.015 (brown dwarf, clamped)
 */
export function visualRadius(absMag: number): number {
  if (!Number.isFinite(absMag)) return MIN_RADIUS
  const raw = BASE_RADIUS * Math.pow(10, -0.2 * (absMag - SUN_ABS_MAG))
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, raw))
}

/**
 * Calculate luminosity relative to the Sun.
 * L/L☉ = 10^((M☉ - M) / 2.5)
 */
export function solarLuminosity(absMag: number): number {
  return Math.pow(10, (SUN_ABS_MAG - absMag) / 2.5)
}

/**
 * Estimate effective temperature from B-V color index.
 * Ballesteros (2012) formula.
 */
export function bvToTemperature(bv: number): number {
  const clamped = Math.max(-0.4, Math.min(bv, 3.5))
  return 4600 * (1 / (0.92 * clamped + 1.7) + 1 / (0.92 * clamped + 0.62))
}
