<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SceneManager } from '../engine'
import { loadCatalog, DEFAULT_CATALOG, FULL_CATALOG } from '../api'
import { useStarStore } from '../stores/starStore'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let sceneManager: SceneManager | null = null
const store = useStarStore()

/** Cached full catalog so we don't re-fetch on toggle. */
let fullCatalogCache: import('../engine').StarData[] | null = null
let defaultCatalogCache: import('../engine').StarData[] | null = null

onMounted(async () => {
  if (!canvasRef.value) return

  sceneManager = new SceneManager(canvasRef.value)

  // Wire interaction callbacks → Pinia store
  sceneManager.interaction.onStarSelect = (star) => {
    store.selectStar(star)
    sceneManager!.flyToStar(star)
  }

  sceneManager.interaction.onStarHover = (star) => {
    store.hoverStar(star)
  }

  sceneManager.interaction.onMeasure = (result) => {
    store.startMeasurement(result.starA)
    store.completeMeasurement(result.starB)
  }

  sceneManager.start()

  // Load both catalogs in parallel
  try {
    const [defaultStars, fullStars] = await Promise.all([
      loadCatalog(DEFAULT_CATALOG),
      loadCatalog(FULL_CATALOG),
    ])

    defaultCatalogCache = defaultStars
    fullCatalogCache = fullStars

    // Merge: use full catalog as base, it has more stars
    // The full catalog is the superset
    store.setCatalog(fullStars)

    // Initially render based on current toggle state
    const starsToRender = store.showFullCatalog ? fullStars : defaultStars
    sceneManager.loadStars(starsToRender)

    console.log(`Loaded ${defaultStars.length} main stars, ${fullStars.length} full catalog`)
  } catch (err) {
    console.error('Failed to load star catalog:', err)
  }

  canvasRef.value.addEventListener('click', onClick)
  canvasRef.value.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  canvasRef.value?.removeEventListener('click', onClick)
  canvasRef.value?.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  sceneManager?.dispose()
  sceneManager = null
})

function toNdc(event: MouseEvent): { x: number; y: number } | null {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  }
}

function onClick(event: MouseEvent): void {
  if (!sceneManager) return
  const ndc = toNdc(event)
  if (!ndc) return
  sceneManager.interaction.handleClick(ndc.x, ndc.y, event.shiftKey)
}

function onMouseMove(event: MouseEvent): void {
  if (!sceneManager) return
  const ndc = toNdc(event)
  if (!ndc) return
  sceneManager.interaction.handleHover(ndc.x, ndc.y)
}

function onResize(): void {
  if (!canvasRef.value || !sceneManager) return
  const { clientWidth, clientHeight } = canvasRef.value.parentElement!
  sceneManager.resize(clientWidth, clientHeight)
}

/** Fly to a star programmatically (called from parent via search). */
function flyToStar(starName: string): void {
  if (!sceneManager) return
  const star = sceneManager.starRenderer.findByName(starName)
  if (star) {
    sceneManager.interaction.select(star)
    sceneManager.flyToStar(star)
  }
}

/** Apply filter predicate to star visibility. */
function applyFilter(predicate: (s: import('../engine').StarData) => boolean): void {
  sceneManager?.applyFilter(predicate)
}

/** Get current camera position. */
function getCameraPosition(): { x: number; y: number; z: number } {
  if (!sceneManager) return { x: 0, y: 0, z: 0 }
  const p = sceneManager.cameraManager.camera.position
  return { x: p.x, y: p.y, z: p.z }
}

/**
 * Switch between main stars and full catalog.
 * Rebuilds the InstancedMesh with the appropriate star set.
 */
function reloadStars(showFull: boolean): void {
  if (!sceneManager) return
  const stars = showFull ? fullCatalogCache : defaultCatalogCache
  if (!stars) return

  // Remove old star mesh from scene
  const oldMesh = sceneManager.starRenderer.getMesh()
  if (oldMesh) sceneManager.scene.remove(oldMesh)

  // Rebuild with new data
  sceneManager.loadStars(stars)
}

function setShowAllLabels(v: boolean): void {
  sceneManager?.setShowAllLabels(v)
}

defineExpose({ flyToStar, applyFilter, getCameraPosition, reloadStars, setShowAllLabels })
</script>

<template>
  <canvas ref="canvasRef" class="starmap-canvas" />
</template>

<style scoped>
.starmap-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>
