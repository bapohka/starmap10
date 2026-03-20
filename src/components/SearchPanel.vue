<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useStarStore } from '../stores/starStore'

const store = useStarStore()
const query = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)
let blurTimerId: ReturnType<typeof setTimeout> | null = null

const emit = defineEmits<{
  search: [query: string]
}>()

const suggestions = computed(() => {
  const q = query.value.trim()
  if (q.length < 1) return []
  return store.findByName(q).slice(0, 8)
})

watch(query, () => {
  isOpen.value = query.value.trim().length >= 1
  selectedIndex.value = -1
})

function onSubmit(): void {
  const q = query.value.trim()
  if (!q) return
  emit('search', q)
  isOpen.value = false
}

function onSelectSuggestion(name: string): void {
  query.value = name
  emit('search', name)
  isOpen.value = false
}

function onKeyDown(e: KeyboardEvent): void {
  if (!isOpen.value || suggestions.value.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault()
    onSelectSuggestion(suggestions.value[selectedIndex.value]!.name)
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

function onBlur(): void {
  if (blurTimerId !== null) clearTimeout(blurTimerId)
  blurTimerId = setTimeout(() => {
    isOpen.value = false
    blurTimerId = null
  }, 150)
}

onBeforeUnmount(() => {
  if (blurTimerId !== null) clearTimeout(blurTimerId)
})

const listboxId = 'star-search-listbox'
</script>

<template>
  <div class="search-panel">
    <div class="search-input-wrap">
      <input
        v-model="query"
        type="text"
        placeholder="Search star..."
        autocomplete="off"
        role="combobox"
        :aria-expanded="isOpen && suggestions.length > 0"
        :aria-controls="listboxId"
        aria-autocomplete="list"
        aria-label="Search stars by name"
        :aria-activedescendant="selectedIndex >= 0 ? `star-option-${selectedIndex}` : undefined"
        @keyup.enter="onSubmit"
        @keydown="onKeyDown"
        @focus="isOpen = query.trim().length >= 1"
        @blur="onBlur"
      />
      <ul
        v-if="isOpen && suggestions.length > 0"
        :id="listboxId"
        role="listbox"
        class="suggestions"
        aria-label="Star suggestions"
      >
        <li
          v-for="(star, i) in suggestions"
          :id="`star-option-${i}`"
          :key="star.id"
          role="option"
          :aria-selected="i === selectedIndex"
          :class="['suggestion', { active: i === selectedIndex }]"
          @mousedown.prevent="onSelectSuggestion(star.name)"
        >
          <span class="sug-name">{{ star.name }}</span>
          <span class="sug-meta">{{ star.distance.toFixed(2) }} pc &middot; {{ star.spectralType }}</span>
        </li>
      </ul>
    </div>
    <button @click="onSubmit" aria-label="Find star">Find</button>
  </div>
</template>

<style scoped>
.search-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  pointer-events: auto;
  z-index: 10;
}

.search-input-wrap {
  position: relative;
}

.search-input-wrap input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: rgba(5, 5, 15, 0.85);
  backdrop-filter: blur(8px);
  color: #e0e0e0;
  font-size: 0.9rem;
  width: 240px;
  outline: none;
}

.search-input-wrap input:focus {
  border-color: #6688cc;
}

.search-input-wrap input::placeholder {
  color: #666;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: rgba(10, 10, 25, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  transition: background 0.1s;
}

.suggestion:hover,
.suggestion.active {
  background: rgba(100, 130, 200, 0.15);
}

.sug-name {
  color: #ddd;
  font-size: 0.85rem;
}

.sug-meta {
  color: #666;
  font-size: 0.75rem;
  white-space: nowrap;
}

.search-panel button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #444;
  background: rgba(50, 50, 80, 0.8);
  color: #e0e0e0;
  cursor: pointer;
  font-size: 0.9rem;
}

.search-panel button:hover {
  background: rgba(70, 70, 120, 0.9);
}
</style>
