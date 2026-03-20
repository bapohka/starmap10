import { csvParse } from 'd3-dsv'
import type { StarData } from '../engine'
import { equatorialToCartesian, parallaxToDistance, absoluteMagnitude } from '../math'
import { spectralToBv, bvToTemperature, solarLuminosity } from '../math/astronomy'

export interface GcnsRow {
  source_id: string
  name: string
  ra: string
  dec: string
  parallax: string
  phot_g_mean_mag: string
  bp_rp: string
  spectral_type: string
  teff_gspphot: string
  [key: string]: string
}

/**
 * Load and parse GCNS v2 CSV data.
 * Expects CSV file at the given URL or path.
 */
export async function loadGcnsCatalog(url: string): Promise<StarData[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load GCNS catalog from ${url}: ${response.status} ${response.statusText}`)
  }
  const text = await response.text()
  const rows = csvParse(text) as unknown as GcnsRow[]

  if (!rows.length || !('parallax' in rows[0]!)) {
    throw new Error(`Invalid GCNS CSV: missing expected columns`)
  }

  return rows
    .filter((row) => row.parallax && parseFloat(row.parallax) > 0)
    .map((row) => parseGcnsRow(row))
    .filter((s): s is StarData => s !== null && s.distance <= 10)
}

function parseGcnsRow(row: GcnsRow): StarData | null {
  const ra = parseFloat(row.ra)
  const dec = parseFloat(row.dec)
  const parallax = parseFloat(row.parallax)

  if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(parallax) || parallax <= 0) {
    return null
  }

  const distance = parallaxToDistance(parallax)
  const appMag = parseFloat(row.phot_g_mean_mag) || 0
  const absMag = absoluteMagnitude(appMag, parallax)
  const spectralType = row.spectral_type || 'M'

  // B-V: estimate from bp_rp if available, else from spectral type
  const bpRp = parseFloat(row.bp_rp)
  const bv = Number.isFinite(bpRp) ? bpRp * 0.52 + 0.06 : spectralToBv(spectralType)

  // Temperature: use catalog value or estimate from B-V
  const teffCat = parseFloat(row.teff_gspphot)
  const temperature = Number.isFinite(teffCat) ? teffCat : bvToTemperature(bv)

  const luminosity = solarLuminosity(absMag)
  const { x, y, z } = equatorialToCartesian(ra, dec, distance)

  return {
    id: row.source_id || '',
    name: row.name || `Gaia ${row.source_id}`,
    ra,
    dec,
    parallax,
    distance,
    appMag,
    absMag,
    bv,
    luminosity,
    spectralType,
    temperature,
    x,
    y,
    z,
  }
}
