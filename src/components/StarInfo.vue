<script setup lang="ts">
import { computed } from 'vue'
import type { StarData } from '../engine'
import type { Measurement } from '../stores/starStore'

const props = defineProps<{
  star: StarData | null
  measurement: Measurement | null
}>()

const emit = defineEmits<{
  close: []
}>()

const PC_TO_LY = 3.26156

const distanceLy = computed(() =>
  props.star ? (props.star.distance * PC_TO_LY).toFixed(2) : '',
)

const simbadUrl = computed(() => {
  if (!props.star) return ''
  const name = encodeURIComponent(props.star.name)
  return `https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=${name}`
})

const wikipediaUrl = computed(() => {
  if (!props.star) return ''
  const name = encodeURIComponent(props.star.name.replace(/\s+/g, '_'))
  return `https://en.wikipedia.org/wiki/${name}`
})

function formatLum(lum: number): string {
  if (lum >= 100) return lum.toFixed(0)
  if (lum >= 1) return lum.toFixed(2)
  if (lum >= 0.001) return lum.toFixed(4)
  return lum.toExponential(2)
}

function spectralDescription(sp: string): string {
  const cls = sp.charAt(0).toUpperCase()
  const descriptions: Record<string, string> = {
    O: 'Blue supergiant',
    B: 'Blue-white star',
    A: 'White star',
    F: 'Yellow-white star',
    G: 'Yellow dwarf (Sun-like)',
    K: 'Orange dwarf',
    M: 'Red dwarf',
    L: 'Brown dwarf (late)',
    T: 'Brown dwarf (cool)',
    Y: 'Sub-brown dwarf',
    D: 'White dwarf',
    W: 'Wolf-Rayet star',
  }
  return descriptions[cls] ?? 'Unknown type'
}
</script>

<template>
  <transition name="slide">
    <aside v-if="star" class="star-info">
      <header>
        <h2>{{ star.name }}</h2>
        <button class="close-btn" aria-label="Close star info" @click="emit('close')">&times;</button>
      </header>

      <div class="spectral-badge" :title="spectralDescription(star.spectralType)">
        {{ star.spectralType }}
        <span class="spectral-desc">{{ spectralDescription(star.spectralType) }}</span>
      </div>

      <section class="data-section">
        <h3>Position</h3>
        <dl>
          <dt>Distance</dt>
          <dd>{{ star.distance.toFixed(3) }} pc &nbsp;({{ distanceLy }} ly)</dd>
          <dt>RA</dt>
          <dd>{{ star.ra.toFixed(4) }}&deg;</dd>
          <dt>Dec</dt>
          <dd>{{ star.dec.toFixed(4) }}&deg;</dd>
          <dt>Parallax</dt>
          <dd>{{ star.parallax.toFixed(2) }} mas</dd>
          <dt>Cartesian</dt>
          <dd>x={{ star.x.toFixed(3) }}, y={{ star.y.toFixed(3) }}, z={{ star.z.toFixed(3) }} pc</dd>
        </dl>
      </section>

      <section class="data-section">
        <h3>Photometry</h3>
        <dl>
          <dt>App. Magnitude</dt>
          <dd>{{ star.appMag.toFixed(2) }}</dd>
          <dt>Abs. Magnitude</dt>
          <dd>{{ star.absMag.toFixed(2) }}</dd>
          <dt>B-V Index</dt>
          <dd>{{ star.bv.toFixed(3) }}</dd>
          <dt>Luminosity</dt>
          <dd>{{ formatLum(star.luminosity) }} L&#x2609;</dd>
          <dt>Temperature</dt>
          <dd>{{ Math.round(star.temperature) }} K</dd>
        </dl>
      </section>

      <!-- Measurement -->
      <section v-if="measurement" class="data-section measure-section">
        <h3>Measurement</h3>
        <div class="measure-pair">
          {{ measurement.starA.name }} &#x2194; {{ measurement.starB.name }}
        </div>
        <dl>
          <dt>Distance</dt>
          <dd>{{ measurement.distancePc.toFixed(3) }} pc &nbsp;({{ measurement.distanceLy.toFixed(3) }} ly)</dd>
        </dl>
      </section>

      <section class="links-section">
        <a :href="simbadUrl" target="_blank" rel="noopener noreferrer" aria-label="Look up on SIMBAD (opens in new tab)">SIMBAD</a>
        <a :href="wikipediaUrl" target="_blank" rel="noopener noreferrer" aria-label="Look up on Wikipedia (opens in new tab)">Wikipedia</a>
      </section>
    </aside>
  </transition>
</template>

<style scoped>
.star-info {
  position: absolute;
  top: 0;
  right: 0;
  width: min(320px, 85vw);
  height: 100%;
  background: rgba(5, 5, 15, 0.92);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: #d0d0d0;
  overflow-y: auto;
  padding: 1.25rem;
  pointer-events: auto;
  font-size: 0.85rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
  line-height: 1.2;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}
.close-btn:hover {
  color: #fff;
}

.spectral-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #e8e8ff;
  margin-bottom: 1rem;
}

.spectral-desc {
  font-weight: 400;
  font-size: 0.8rem;
  color: #999;
}

.data-section {
  margin-bottom: 1rem;
}

.data-section h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;
  margin: 0 0 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.25rem;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 0.75rem;
  margin: 0;
}

dt {
  color: #888;
  white-space: nowrap;
}

dd {
  margin: 0;
  color: #ccc;
  text-align: right;
}

.measure-section {
  border: 1px solid rgba(255, 204, 0, 0.2);
  background: rgba(255, 204, 0, 0.04);
  padding: 0.75rem;
  border-radius: 6px;
}

.measure-section h3 {
  color: #cc9900;
  border-bottom-color: rgba(255, 204, 0, 0.15);
}

.measure-pair {
  color: #ffcc00;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.links-section {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.links-section a {
  color: #6688cc;
  text-decoration: none;
  font-size: 0.85rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid rgba(100, 130, 200, 0.3);
  border-radius: 4px;
  transition: background 0.15s;
}

.links-section a:hover {
  background: rgba(100, 130, 200, 0.15);
  color: #88aaee;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
