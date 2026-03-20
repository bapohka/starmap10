import { csvParse } from 'd3-dsv'
import type { StarData } from '../engine'
import { loadGcnsCatalog } from './gcns'
import { equatorialToCartesian, parallaxToDistance, absoluteMagnitude } from '../math'
import { spectralToBv, bvToTemperature, solarLuminosity } from '../math/astronomy'

export type CatalogFormat = 'csv' | 'json' | 'the10pc'

export interface CatalogSource {
  url: string
  format: CatalogFormat
}

/**
 * Load star catalog from a URL, auto-detecting format from extension
 * or using the explicit format parameter.
 * Supports:
 *  - CSV (GCNS v2 format)
 *  - JSON (pre-processed array of star records)
 *  - the10pc (The10pcSample_v2.csv — dedicated parser)
 */
export async function loadCatalog(source: CatalogSource): Promise<StarData[]> {
  if (source.format === 'csv') {
    return loadGcnsCatalog(source.url)
  }
  if (source.format === 'the10pc') {
    return load10pcCatalog(source.url)
  }
  return loadJsonCatalog(source.url)
}

export interface JsonStarRecord {
  id?: string
  name: string
  ra: number
  dec: number
  parallax: number
  appMag?: number
  absMag?: number
  bv?: number
  spectralType?: string
  temperature?: number
  components?: string[]
}

/**
 * Load pre-processed JSON catalog.
 * Each record must have at minimum: name, ra, dec, parallax.
 */
async function loadJsonCatalog(url: string): Promise<StarData[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load catalog from ${url}: ${response.status} ${response.statusText}`)
  }
  const records: unknown = await response.json()

  if (!Array.isArray(records)) {
    throw new Error(`Invalid JSON catalog: expected array, got ${typeof records}`)
  }

  return (records as JsonStarRecord[])
    .filter((r) => r.parallax > 0)
    .map((r) => jsonRecordToStarData(r))
    .filter((s) => Number.isFinite(s.distance) && s.distance <= 10)
}

function jsonRecordToStarData(r: JsonStarRecord): StarData {
  const distance = parallaxToDistance(r.parallax)
  const appMag = r.appMag ?? 0
  const absMag = r.absMag ?? absoluteMagnitude(appMag, r.parallax)
  const spectralType = r.spectralType ?? 'M'
  const bv = r.bv ?? spectralToBv(spectralType)
  const temperature = r.temperature ?? bvToTemperature(bv)
  const luminosity = solarLuminosity(absMag)
  const { x, y, z } = equatorialToCartesian(r.ra, r.dec, distance)

  return {
    id: r.id ?? r.name.replace(/\s+/g, '_'),
    name: r.name,
    ra: r.ra,
    dec: r.dec,
    parallax: r.parallax,
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

// ─── The 10pc Sample v2 CSV Parser ────────────────────────────────────

interface The10pcRow {
  NB_OBJ: string
  NB_SYS: string
  SYSTEM_NAME: string
  OBJ_CAT: string
  OBJ_NAME: string
  RA: string
  DEC: string
  PARALLAX: string
  SP_TYPE: string
  G: string
  G_ESTIMATE: string
  GBP: string
  GRP: string
  V: string
  B: string
  COMMON_NAME: string
  SIMBAD_NAME: string
  GJ: string
  [key: string]: string
}

/**
 * Load The10pcSample_v2.csv — the full 10pc sample catalog.
 * Filters out planets and objects without valid coordinates/parallax.
 * Parses asynchronously via fetch + d3-dsv.
 */
async function load10pcCatalog(url: string): Promise<StarData[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load 10pc catalog from ${url}: ${response.status} ${response.statusText}`)
  }
  const text = await response.text()

  const rows = csvParse(text) as unknown as The10pcRow[]

  if (!rows.length || !('OBJ_CAT' in rows[0]!) || !('RA' in rows[0]!)) {
    throw new Error(`Invalid 10pc CSV: missing expected columns (OBJ_CAT, RA, etc.)`)
  }

  const stars: StarData[] = []

  for (const row of rows) {
    // Skip planets
    if (row.OBJ_CAT === 'Planet') continue

    const ra = parseFloat(row.RA)
    const dec = parseFloat(row.DEC)
    const parallax = parseFloat(row.PARALLAX)

    if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(parallax) || parallax <= 0) continue

    const distance = parallaxToDistance(parallax)
    if (distance > 10) continue

    // Name: prefer COMMON_NAME, then OBJ_NAME, then SYSTEM_NAME
    const name = (row.COMMON_NAME || row.OBJ_NAME || row.SYSTEM_NAME || '').trim()
    if (!name) continue

    // Apparent magnitude: prefer V-band, fall back to G-band
    const vMag = parseFloat(row.V)
    const gMag = parseFloat(row.G)
    const gEst = parseFloat(row.G_ESTIMATE)
    const appMag = Number.isFinite(vMag) ? vMag : Number.isFinite(gMag) ? gMag : Number.isFinite(gEst) ? gEst : 15

    const absMag = absoluteMagnitude(appMag, parallax)
    const spectralType = (row.SP_TYPE || 'M').trim()

    // B-V: compute from B and V if both available, else estimate from GBP-GRP or spectral type
    const bMag = parseFloat(row.B)
    const gbp = parseFloat(row.GBP)
    const grp = parseFloat(row.GRP)
    let bv: number
    if (Number.isFinite(bMag) && Number.isFinite(vMag)) {
      bv = bMag - vMag
    } else if (Number.isFinite(gbp) && Number.isFinite(grp)) {
      // Approximate B-V from Gaia BP-RP
      bv = (gbp - grp) * 0.52 + 0.06
    } else {
      bv = spectralToBv(spectralType)
    }

    const temperature = bvToTemperature(bv)
    const luminosity = solarLuminosity(absMag)
    const { x, y, z } = equatorialToCartesian(ra, dec, distance)

    const id = row.GJ || row.SIMBAD_NAME || `10pc_${row.NB_OBJ}`

    stars.push({
      id,
      name,
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
    })
  }

  return stars
}

/**
 * Default catalog source — local JSON with well-known 10pc stars.
 */
export const DEFAULT_CATALOG: CatalogSource = {
  url: '/data/catalog-10pc.json',
  format: 'json',
}

/**
 * Full 10pc sample catalog from The10pcSample_v2.csv.
 */
export const FULL_CATALOG: CatalogSource = {
  url: '/The10pcSample_v2.csv',
  format: 'the10pc',
}
