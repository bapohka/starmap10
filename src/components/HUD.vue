<script setup lang="ts">
import { ref } from 'vue'
import { useStarStore } from '../stores/starStore'

const store = useStarStore()

// Camera position display (updated from parent)
const cameraPos = ref({ x: 0, y: 0, z: 0 })
const cameraDistance = ref(0)

// Accept camera updates from parent
function updateCamera(x: number, y: number, z: number): void {
  cameraPos.value = {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    z: Math.round(z * 100) / 100,
  }
  cameraDistance.value = Math.round(Math.sqrt(x * x + y * y + z * z) * 100) / 100
}

// Scale labels for the axes indicator
const axisSize = 60
const axisLabels = [
  { axis: 'X', color: '#ff4444', desc: 'Vernal Equinox' },
  { axis: 'Y', color: '#44ff44', desc: '' },
  { axis: 'Z', color: '#4488ff', desc: 'North Celestial Pole' },
]

defineExpose({ updateCamera })
</script>

<template>
  <div class="hud">
    <!-- Axes legend -->
    <div class="axes-indicator">
      <svg :width="axisSize + 40" :height="axisSize + 20" class="axes-svg">
        <!-- X axis -->
        <line x1="20" y1="55" x2="70" y2="55" stroke="#ff4444" stroke-width="2" />
        <text x="74" y="59" fill="#ff4444" font-size="11" font-weight="bold">X</text>
        <!-- Y axis -->
        <line x1="20" y1="55" x2="50" y2="30" stroke="#44ff44" stroke-width="2" />
        <text x="52" y="28" fill="#44ff44" font-size="11" font-weight="bold">Y</text>
        <!-- Z axis -->
        <line x1="20" y1="55" x2="20" y2="10" stroke="#4488ff" stroke-width="2" />
        <text x="8" y="8" fill="#4488ff" font-size="11" font-weight="bold">Z</text>
        <!-- Origin dot -->
        <circle cx="20" cy="55" r="3" fill="#ffffff" opacity="0.5" />
      </svg>
      <div class="axis-labels">
        <div v-for="a in axisLabels" :key="a.axis" class="axis-label">
          <span :style="{ color: a.color }">{{ a.axis }}</span>
          <span v-if="a.desc" class="axis-desc">{{ a.desc }}</span>
        </div>
      </div>
    </div>

    <!-- Camera info -->
    <div class="camera-info">
      <div class="cam-label">Camera</div>
      <div class="cam-coords">
        <span class="coord" style="color: #ff6666">{{ cameraPos.x }}</span>
        <span class="coord" style="color: #66ff66">{{ cameraPos.y }}</span>
        <span class="coord" style="color: #6699ff">{{ cameraPos.z }}</span>
      </div>
      <div class="cam-dist">{{ cameraDistance }} pc from origin</div>
    </div>

    <!-- Hovered star tooltip -->
    <div v-if="store.hoveredStar" class="hover-tooltip">
      {{ store.hoveredStar.name }}
      <span class="hover-dist">{{ store.hoveredStar.distance.toFixed(2) }} pc</span>
      <span class="hover-spec">{{ store.hoveredStar.spectralType }}</span>
    </div>

    <!-- Star count -->
    <div class="star-count">
      {{ store.stats.visible }} stars
    </div>

    <!-- Scale bar -->
    <div class="scale-bar">
      <div class="scale-line"></div>
      <div class="scale-text">1 parsec (3.26 ly)</div>
    </div>
  </div>
</template>

<style scoped>
.hud {
  pointer-events: none;
  position: absolute;
  inset: 0;
  font-family: 'Courier New', monospace;
}

.axes-indicator {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.5rem;
}

.axes-svg {
  display: block;
}

.axis-labels {
  margin-top: 0.25rem;
}

.axis-label {
  font-size: 0.7rem;
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
}

.axis-desc {
  color: #555;
  font-size: 0.65rem;
}

.camera-info {
  position: absolute;
  bottom: 1rem;
  right: 140px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.cam-label {
  color: #555;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.15rem;
}

.cam-coords {
  display: flex;
  gap: 0.6rem;
}

.coord {
  font-variant-numeric: tabular-nums;
}

.cam-dist {
  color: #555;
  font-size: 0.7rem;
  margin-top: 0.1rem;
}

.hover-tooltip {
  position: absolute;
  top: 3.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #eee;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
}

.hover-dist {
  color: #888;
  font-size: 0.8rem;
}

.hover-spec {
  color: #aaa;
  font-size: 0.75rem;
}

.star-count {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  color: #444;
  font-size: 0.75rem;
}

.scale-bar {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
}

.scale-line {
  width: 80px;
  height: 2px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 auto;
}

.scale-text {
  text-align: center;
  color: #555;
  font-size: 0.65rem;
  margin-top: 0.15rem;
}
</style>
