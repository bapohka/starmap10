<script setup lang="ts">
import type { StarData } from '../engine'
import type { Measurement } from '../stores/starStore'

defineProps<{
  star: StarData | null
  measurement: Measurement | null
}>()

function formatLuminosity(lum: number): string {
  if (lum >= 1) return lum.toFixed(2)
  if (lum >= 0.001) return lum.toFixed(4)
  return lum.toExponential(2)
}
</script>

<template>
  <div class="info-panel">
    <!-- Star info card -->
    <div v-if="star" class="info-card">
      <h3>{{ star.name }}</h3>
      <ul>
        <li><strong>Distance:</strong> {{ star.distance.toFixed(3) }} pc ({{ (star.distance * 3.26156).toFixed(2) }} ly)</li>
        <li><strong>RA:</strong> {{ star.ra.toFixed(4) }}&deg;</li>
        <li><strong>Dec:</strong> {{ star.dec.toFixed(4) }}&deg;</li>
        <li><strong>App. Mag:</strong> {{ star.appMag.toFixed(2) }}</li>
        <li><strong>Abs. Mag:</strong> {{ star.absMag.toFixed(2) }}</li>
        <li><strong>Spectral:</strong> {{ star.spectralType }}</li>
        <li><strong>Temperature:</strong> {{ Math.round(star.temperature) }} K</li>
        <li><strong>Luminosity:</strong> {{ formatLuminosity(star.luminosity) }} L&#x2609;</li>
        <li><strong>B-V:</strong> {{ star.bv.toFixed(3) }}</li>
      </ul>
    </div>

    <!-- Measurement result -->
    <div v-if="measurement" class="measure-card">
      <h4>Measurement</h4>
      <div class="measure-stars">
        {{ measurement.starA.name }} &#x2194; {{ measurement.starB.name }}
      </div>
      <div class="measure-distance">
        <strong>{{ measurement.distancePc.toFixed(3) }}</strong> pc
        &nbsp;/&nbsp;
        <strong>{{ measurement.distanceLy.toFixed(3) }}</strong> ly
      </div>
    </div>

    <!-- Hint -->
    <div v-if="!star && !measurement" class="hint">
      Click a star to select &middot; Shift+Click two stars to measure
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: auto;
}

.info-card,
.measure-card {
  background: rgba(0, 0, 0, 0.82);
  color: #e0e0e0;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  min-width: 240px;
  font-size: 0.85rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.info-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #ffffff;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  margin-bottom: 0.2rem;
}

.measure-card h4 {
  margin: 0 0 0.4rem;
  color: #ffcc00;
  font-size: 0.95rem;
}

.measure-stars {
  margin-bottom: 0.3rem;
  color: #ccc;
}

.measure-distance {
  font-size: 1.05rem;
  color: #ffcc00;
}

.hint {
  background: rgba(0, 0, 0, 0.5);
  color: #888;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  pointer-events: none;
}
</style>
