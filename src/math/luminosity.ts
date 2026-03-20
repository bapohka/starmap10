/**
 * Calculate absolute magnitude from apparent magnitude and parallax (mas).
 * M = m + 5 + 5*log10(parallax/1000)
 */
export function absoluteMagnitude(appMag: number, parallaxMas: number): number {
  if (!Number.isFinite(parallaxMas) || parallaxMas <= 0) return NaN
  if (!Number.isFinite(appMag)) return NaN
  return appMag + 5 + 5 * Math.log10(parallaxMas / 1000)
}

/**
 * Calculate luminosity relative to the Sun from absolute magnitude.
 * L/L_sun = 10^((M_sun - M) / 2.5)
 */
export function luminosityFromAbsMag(absMag: number, sunAbsMag = 4.83): number {
  return Math.pow(10, (sunAbsMag - absMag) / 2.5)
}
