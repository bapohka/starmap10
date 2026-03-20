import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StarData } from '../engine'

const PC_TO_LY = 3.26156

/** Absolute magnitude threshold for "main" stars (brighter than Mv 15). */
const MAIN_STAR_MAG_LIMIT = 15

export interface Measurement {
  starA: StarData
  starB: StarData
  distancePc: number
  distanceLy: number
}

export interface FilterState {
  maxDistance: number
  minMagnitude: number
  maxMagnitude: number
  spectralClasses: Set<string>
}

const ALL_SPECTRAL = new Set(['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y', 'D', 'W'])

export const useStarStore = defineStore('stars', () => {
  const catalog = ref<StarData[]>([])
  const selectedStar = ref<StarData | null>(null)
  const hoveredStar = ref<StarData | null>(null)

  const measurementAnchor = ref<StarData | null>(null)
  const measurement = ref<Measurement | null>(null)
  const isMeasuring = computed(() => measurementAnchor.value !== null)

  // Full catalog toggle
  const showFullCatalog = ref(false)

  // Show all star labels
  const showAllLabels = ref(false)

  // Filters
  const filters = ref<FilterState>({
    maxDistance: 10,
    minMagnitude: -2,
    maxMagnitude: 28,
    spectralClasses: new Set(ALL_SPECTRAL),
  })

  /**
   * "Main" stars: bright (Mabs < 15) or have a proper common name (not auto-generated).
   * When showFullCatalog is false, only these are returned.
   */
  function isMainStar(s: StarData): boolean {
    return s.absMag < MAIN_STAR_MAG_LIMIT || /[A-Za-z]/.test(s.name.charAt(0))
  }

  /** Stars to render, based on showFullCatalog toggle. */
  const visibleStars = computed(() => {
    if (showFullCatalog.value) return catalog.value
    return catalog.value.filter(isMainStar)
  })

  const filteredCatalog = computed(() => {
    const f = filters.value
    return visibleStars.value.filter((s) => {
      if (s.distance > f.maxDistance) return false
      if (s.absMag < f.minMagnitude || s.absMag > f.maxMagnitude) return false
      const cls = s.spectralType.charAt(0).toUpperCase()
      if (!f.spectralClasses.has(cls)) return false
      return true
    })
  })

  const stats = computed(() => ({
    total: catalog.value.length,
    visible: filteredCatalog.value.length,
    filtered: visibleStars.value.length - filteredCatalog.value.length,
    mainStars: catalog.value.filter(isMainStar).length,
  }))

  function setCatalog(stars: StarData[]): void {
    catalog.value = stars
  }

  function selectStar(star: StarData | null): void {
    selectedStar.value = star
  }

  function hoverStar(star: StarData | null): void {
    hoveredStar.value = star
  }

  function startMeasurement(star: StarData): void {
    measurementAnchor.value = star
    measurement.value = null
  }

  function completeMeasurement(starB: StarData): void {
    const starA = measurementAnchor.value
    if (!starA) return

    const dx = starB.x - starA.x
    const dy = starB.y - starA.y
    const dz = starB.z - starA.z
    const distancePc = Math.sqrt(dx * dx + dy * dy + dz * dz)

    measurement.value = {
      starA,
      starB,
      distancePc,
      distanceLy: distancePc * PC_TO_LY,
    }
    measurementAnchor.value = null
  }

  function clearMeasurement(): void {
    measurementAnchor.value = null
    measurement.value = null
  }

  function setMaxDistance(d: number): void {
    filters.value = { ...filters.value, maxDistance: d }
  }

  function setMagnitudeRange(min: number, max: number): void {
    filters.value = { ...filters.value, minMagnitude: min, maxMagnitude: max }
  }

  function toggleSpectralClass(cls: string): void {
    const next = new Set(filters.value.spectralClasses)
    if (next.has(cls)) {
      next.delete(cls)
    } else {
      next.add(cls)
    }
    filters.value = { ...filters.value, spectralClasses: next }
  }

  function resetFilters(): void {
    filters.value = {
      maxDistance: 10,
      minMagnitude: -2,
      maxMagnitude: 28,
      spectralClasses: new Set(ALL_SPECTRAL),
    }
  }

  function findByName(query: string): StarData[] {
    const q = query.toLowerCase()
    return catalog.value.filter((s) => s.name.toLowerCase().includes(q))
  }

  function setShowFullCatalog(v: boolean): void {
    showFullCatalog.value = v
  }

  function setShowAllLabels(v: boolean): void {
    showAllLabels.value = v
  }

  return {
    catalog,
    selectedStar,
    hoveredStar,
    measurementAnchor,
    measurement,
    isMeasuring,
    showFullCatalog,
    showAllLabels,
    filters,
    visibleStars,
    filteredCatalog,
    stats,
    setCatalog,
    selectStar,
    hoverStar,
    startMeasurement,
    completeMeasurement,
    clearMeasurement,
    setMaxDistance,
    setMagnitudeRange,
    toggleSpectralClass,
    resetFilters,
    findByName,
    setShowFullCatalog,
    setShowAllLabels,
  }
})
