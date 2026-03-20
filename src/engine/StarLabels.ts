import * as THREE from 'three'
import type { StarData } from './StarSystem'

interface LabelEntry {
  star: StarData
  sprite: THREE.Sprite
  material: THREE.SpriteMaterial
  texture: THREE.Texture
}

/** Notable stars that get proximity labels. */
const NOTABLE_STARS = new Set([
  'Proxima Centauri',
  'Alpha Centauri A',
  'Alpha Centauri B',
  "Barnard's Star",
  'Sirius A',
  'Sirius B',
  'Procyon A',
  'Tau Ceti',
  'Epsilon Eridani',
  'Luyten\'s Star',
  'Ross 128',
  'Wolf 359',
  'Lalande 21185',
  'Altair',
])

/** Distance (camera-to-star) at which label starts appearing. */
const SHOW_DISTANCE = 8
/** Distance at which label is fully opaque. */
const FULL_OPACITY_DISTANCE = 3

/** Minimum camera movement (squared) to trigger label update. */
const MOVE_THRESHOLD_SQ = 0.0001

/** Minimum 3D distance between stars before their labels get separated. */
const LABEL_SEPARATION_DIST = 0.5
/** Vertical offset applied to separate overlapping labels. */
const LABEL_SEPARATION_OFFSET = 0.1

export class StarLabels {
  readonly group: THREE.Group
  private labels: LabelEntry[] = []
  private lastCamX = NaN
  private lastCamY = NaN
  private lastCamZ = NaN
  private showAll = false
  private cachedStars: StarData[] = []

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'StarLabels'
  }

  /** Create labels for notable stars found in the catalog. */
  build(stars: StarData[]): void {
    this.cachedStars = stars
    this.rebuild()
  }

  /** Toggle between notable-only and all-star labels. */
  setShowAll(v: boolean): void {
    if (this.showAll === v) return
    this.showAll = v
    this.rebuild()
  }

  private rebuild(): void {
    this.disposeLabels()

    for (const star of this.cachedStars) {
      if (!this.showAll && !NOTABLE_STARS.has(star.name)) continue

      const texture = this.createLabelTexture(star.name)
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: this.showAll ? 0.7 : 0,
        depthWrite: false,
        depthTest: false,
        sizeAttenuation: true,
      })

      const sprite = new THREE.Sprite(material)
      sprite.position.set(star.x, star.y + 0.07, star.z)
      sprite.scale.set(0.4, 0.1, 1)

      if (this.showAll) {
        sprite.visible = true
      }

      this.labels.push({ star, sprite, material, texture })
      this.group.add(sprite)
    }

    this.separateOverlappingLabels()
    // Force camera position recalculation on next update
    this.lastCamX = NaN
  }

  /** Push apart labels of stars that are too close (e.g. binary systems). */
  private separateOverlappingLabels(): void {
    for (let i = 0; i < this.labels.length; i++) {
      const entryA = this.labels[i]!
      for (let j = i + 1; j < this.labels.length; j++) {
        const entryB = this.labels[j]!
        const dx = entryA.star.x - entryB.star.x
        const dy = entryA.star.y - entryB.star.y
        const dz = entryA.star.z - entryB.star.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < LABEL_SEPARATION_DIST) {
          entryA.sprite.position.y += LABEL_SEPARATION_OFFSET
          entryB.sprite.position.y -= LABEL_SEPARATION_OFFSET
        }
      }
    }
  }

  /** Update label visibility based on camera distance. Skips if camera hasn't moved. */
  update(camera: THREE.Camera): void {
    // In show-all mode, labels are always visible — no per-frame update needed
    if (this.showAll) return

    const camPos = camera.position

    // Skip update if camera hasn't moved significantly
    const dx0 = camPos.x - this.lastCamX
    const dy0 = camPos.y - this.lastCamY
    const dz0 = camPos.z - this.lastCamZ
    if (dx0 * dx0 + dy0 * dy0 + dz0 * dz0 < MOVE_THRESHOLD_SQ) return
    this.lastCamX = camPos.x
    this.lastCamY = camPos.y
    this.lastCamZ = camPos.z

    for (const entry of this.labels) {
      const dx = camPos.x - entry.star.x
      const dy = camPos.y - entry.star.y
      const dz = camPos.z - entry.star.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist > SHOW_DISTANCE) {
        entry.material.opacity = 0
        entry.sprite.visible = false
      } else {
        entry.sprite.visible = true
        // Fade in as camera approaches
        const t = 1 - (dist - FULL_OPACITY_DISTANCE) / (SHOW_DISTANCE - FULL_OPACITY_DISTANCE)
        entry.material.opacity = Math.max(0, Math.min(1, t)) * 0.85
      }
    }
  }

  private createLabelTexture(text: string): THREE.Texture {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const fontSize = 48
    const padding = 16

    ctx.font = `${fontSize}px 'Courier New', monospace`
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width

    canvas.width = Math.ceil(textWidth + padding * 2)
    canvas.height = fontSize + padding * 2

    // Re-set font after canvas resize
    ctx.font = `${fontSize}px 'Courier New', monospace`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // Subtle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Text with glow
    ctx.shadowColor = 'rgba(100, 150, 255, 0.6)'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#dde4ff'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  private disposeLabels(): void {
    for (const entry of this.labels) {
      entry.texture.dispose()
      entry.material.dispose()
      this.group.remove(entry.sprite)
    }
    this.labels = []
  }

  dispose(): void {
    this.disposeLabels()
  }
}
