<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import StarMap from './components/StarMap.vue'
import StarInfo from './components/StarInfo.vue'
import SearchPanel from './components/SearchPanel.vue'
import MapControls from './components/MapControls.vue'
import HUD from './components/HUD.vue'
import ViewToggle from './components/ViewToggle.vue'
import { useStarStore } from './stores/starStore'
import type { StarData } from './engine'

const store = useStarStore()
const starMapRef = ref<InstanceType<typeof StarMap> | null>(null)
const hudRef = ref<InstanceType<typeof HUD> | null>(null)

let cameraRafId: number | null = null

function onSearch(query: string): void {
  starMapRef.value?.flyToStar(query)
}

function onCloseInfo(): void {
  store.selectStar(null)
}

function onFiltersChanged(): void {
  const f = store.filters
  starMapRef.value?.applyFilter((s: StarData) => {
    if (s.distance > f.maxDistance) return false
    if (s.absMag < f.minMagnitude || s.absMag > f.maxMagnitude) return false
    const cls = s.spectralType.charAt(0).toUpperCase()
    if (!f.spectralClasses.has(cls)) return false
    return true
  })
}

function onViewToggled(): void {
  starMapRef.value?.reloadStars(store.showFullCatalog)
  // Re-apply current filters after reload
  onFiltersChanged()
}

function onLabelsToggled(v: boolean): void {
  starMapRef.value?.setShowAllLabels(v)
}

// Also react to store filter changes from any source
watch(() => store.filters, onFiltersChanged, { deep: true })

// Update HUD camera position each frame
function updateCameraLoop(): void {
  if (hudRef.value && starMapRef.value) {
    const pos = starMapRef.value.getCameraPosition()
    hudRef.value.updateCamera(pos.x, pos.y, pos.z)
  }
  cameraRafId = requestAnimationFrame(updateCameraLoop)
}

onMounted(() => {
  cameraRafId = requestAnimationFrame(updateCameraLoop)
})

onBeforeUnmount(() => {
  if (cameraRafId !== null) cancelAnimationFrame(cameraRafId)
})
</script>

<template>
  <div class="app-container">
    <StarMap ref="starMapRef" />
    <div class="ui-overlay">
      <SearchPanel @search="onSearch" />
      <ViewToggle @toggled="onViewToggled" @labels-toggled="onLabelsToggled" />
      <HUD ref="hudRef" />
      <MapControls @filters-changed="onFiltersChanged" />
      <StarInfo
        :star="store.selectedStar"
        :measurement="store.measurement"
        @close="onCloseInfo"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
