/**
 * Convert equatorial coordinates (RA, Dec, distance) to Cartesian (x, y, z).
 * RA and Dec in degrees, distance in parsecs.
 * Returns right-handed system: x toward vernal equinox, z toward NCP.
 */
export function equatorialToCartesian(
  raDeg: number,
  decDeg: number,
  distancePc: number,
): { x: number; y: number; z: number } {
  const ra = (raDeg * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  const cosDec = Math.cos(dec)

  return {
    x: distancePc * cosDec * Math.cos(ra),
    y: distancePc * cosDec * Math.sin(ra),
    z: distancePc * Math.sin(dec),
  }
}

/**
 * Convert parallax (mas) to distance (parsecs).
 */
export function parallaxToDistance(parallaxMas: number): number {
  if (!Number.isFinite(parallaxMas) || parallaxMas <= 0) return Infinity
  return 1000 / parallaxMas
}
