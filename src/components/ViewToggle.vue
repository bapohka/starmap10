<script setup lang="ts">
import { useStarStore } from '../stores/starStore'

const store = useStarStore()

const emit = defineEmits<{
  toggled: []
  labelsToggled: [value: boolean]
}>()

function onToggle(): void {
  store.setShowFullCatalog(!store.showFullCatalog)
  emit('toggled')
}

function onLabelsToggle(): void {
  const next = !store.showAllLabels
  store.setShowAllLabels(next)
  emit('labelsToggled', next)
}
</script>

<template>
  <div class="view-toggle">
    <label class="toggle-label">
      <button
        role="switch"
        :aria-checked="store.showFullCatalog"
        :aria-label="store.showFullCatalog ? 'Showing full catalog, switch to main stars' : 'Showing main stars, switch to full catalog'"
        class="toggle-switch"
        :class="{ active: store.showFullCatalog }"
        @click="onToggle"
      >
        <span class="toggle-knob" />
      </button>
      <span class="toggle-text">
        {{ store.showFullCatalog ? 'Full Catalog' : 'Main Stars' }}
        <span class="toggle-count">
          ({{ store.showFullCatalog ? store.stats.total : store.stats.mainStars }})
        </span>
      </span>
    </label>
    <label class="toggle-label">
      <button
        role="switch"
        :aria-checked="store.showAllLabels"
        aria-label="Toggle all star labels"
        class="toggle-switch"
        :class="{ active: store.showAllLabels }"
        @click="onLabelsToggle"
      >
        <span class="toggle-knob" />
      </button>
      <span class="toggle-text">Labels</span>
    </label>
  </div>
</template>

<style scoped>
.view-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  pointer-events: auto;
  z-index: 11;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-end;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  background: rgba(5, 5, 15, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  transition: background 0.2s;
  flex-shrink: 0;
  cursor: pointer;
  padding: 0;
}

.toggle-switch:focus-visible {
  outline: 2px solid #6688cc;
  outline-offset: 2px;
}

.toggle-switch.active {
  background: rgba(100, 140, 220, 0.5);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #aaa;
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
  pointer-events: none;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(16px);
  background: #dde4ff;
}

.toggle-text {
  font-size: 0.8rem;
  color: #ccc;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.toggle-count {
  color: #666;
  font-size: 0.75rem;
}
</style>
