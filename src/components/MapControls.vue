<script setup lang="ts">
import { computed } from 'vue'
import { useStarStore } from '../stores/starStore'

const store = useStarStore()

const maxDistance = computed({
  get: () => store.filters.maxDistance,
  set: (v: number) => store.setMaxDistance(v),
})

const maxMagnitude = computed({
  get: () => store.filters.maxMagnitude,
  set: (v: number) => store.setMagnitudeRange(store.filters.minMagnitude, v),
})

const spectralClasses = ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y']

const spectralColors: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#fff4ea', K: '#ffd2a1', M: '#ffcc6f', L: '#ff8800',
  T: '#cc5500', Y: '#882200',
}

const spectralNames: Record<string, string> = {
  O: 'O — Blue supergiant', B: 'B — Blue-white', A: 'A — White',
  F: 'F — Yellow-white', G: 'G — Yellow (Sun-like)', K: 'K — Orange dwarf',
  M: 'M — Red dwarf', L: 'L — Brown dwarf', T: 'T — Cool brown dwarf',
  Y: 'Y — Sub-brown dwarf',
}

function isClassActive(cls: string): boolean {
  return store.filters.spectralClasses.has(cls)
}

const emit = defineEmits<{
  filtersChanged: []
}>()

function onDistanceChange(e: Event): void {
  const val = parseFloat((e.target as HTMLInputElement).value)
  maxDistance.value = val
  emit('filtersChanged')
}

function onMagnitudeChange(e: Event): void {
  const val = parseFloat((e.target as HTMLInputElement).value)
  maxMagnitude.value = val
  emit('filtersChanged')
}

function onToggleClass(cls: string): void {
  store.toggleSpectralClass(cls)
  emit('filtersChanged')
}

function onReset(): void {
  store.resetFilters()
  emit('filtersChanged')
}
</script>

<template>
  <div class="map-controls">
    <h3>Filters</h3>

    <!-- Distance slider -->
    <div class="control-group">
      <label for="dist-slider">
        Distance
        <span class="value">&#x2264; {{ maxDistance.toFixed(1) }} pc</span>
      </label>
      <input
        id="dist-slider"
        type="range"
        min="0.5"
        max="10"
        step="0.1"
        :value="maxDistance"
        :aria-valuetext="`${maxDistance.toFixed(1)} parsecs`"
        @input="onDistanceChange"
      />
    </div>

    <!-- Magnitude slider -->
    <div class="control-group">
      <label for="mag-slider">
        Faint limit
        <span class="value">Mv &#x2264; {{ maxMagnitude.toFixed(0) }}</span>
      </label>
      <input
        id="mag-slider"
        type="range"
        min="0"
        max="28"
        step="1"
        :value="maxMagnitude"
        :aria-valuetext="`Absolute magnitude ${maxMagnitude.toFixed(0)}`"
        @input="onMagnitudeChange"
      />
    </div>

    <!-- Spectral class toggles -->
    <div class="control-group">
      <label>Spectral class</label>
      <div class="spectral-toggles" role="group" aria-label="Spectral class filters">
        <button
          v-for="cls in spectralClasses"
          :key="cls"
          :class="['spectral-btn', { active: isClassActive(cls) }]"
          :style="{ '--cls-color': spectralColors[cls] }"
          :aria-label="spectralNames[cls]"
          :aria-pressed="isClassActive(cls)"
          @click="onToggleClass(cls)"
        >
          {{ cls }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats" aria-live="polite">
      {{ store.stats.visible }} / {{ store.stats.total }} stars visible
    </div>

    <button class="reset-btn" @click="onReset">Reset filters</button>
  </div>
</template>

<style scoped>
.map-controls {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(5, 5, 15, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  color: #d0d0d0;
  pointer-events: auto;
  min-width: 260px;
  max-width: 340px;
  font-size: 0.85rem;
}

.map-controls h3 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.control-group {
  margin-bottom: 0.75rem;
}

.control-group label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.3rem;
  font-size: 0.82rem;
  color: #aaa;
}

.value {
  color: #ddd;
  font-variant-numeric: tabular-nums;
}

input[type="range"] {
  width: 100%;
  height: 4px;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6688cc;
  border: 2px solid #334466;
  cursor: pointer;
}

input[type="range"]:focus-visible {
  outline: 2px solid #6688cc;
  outline-offset: 2px;
}

.spectral-toggles {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.spectral-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  color: #888;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.spectral-btn.active {
  background: color-mix(in srgb, var(--cls-color) 25%, transparent);
  color: var(--cls-color);
  border-color: var(--cls-color);
}

.spectral-btn:hover {
  border-color: #666;
}

.spectral-btn:focus-visible {
  outline: 2px solid #6688cc;
  outline-offset: 1px;
}

.stats {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.reset-btn {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #bbb;
}
</style>
