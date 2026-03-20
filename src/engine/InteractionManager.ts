import * as THREE from 'three'
import type { StarData } from './StarSystem'
import type { StarRenderer } from './StarRenderer'

const PC_TO_LY = 3.26156

export interface MeasurementResult {
  starA: StarData
  starB: StarData
  distancePc: number
  distanceLy: number
}

/**
 * Handles all user interaction with the star field:
 * - Raycasting for hover and click detection
 * - Selection highlight ring around selected star
 * - Measurement tape line between two stars (Shift+Click)
 * - Hover highlight
 */
export class InteractionManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private starRenderer: StarRenderer

  // Selection highlight
  private selectionRing: THREE.Mesh | null = null
  private selectionRingMaterial: THREE.MeshBasicMaterial
  private selectionRingGeometry: THREE.RingGeometry

  // Hover highlight
  private hoverRing: THREE.Mesh | null = null
  private hoverRingMaterial: THREE.MeshBasicMaterial

  // Measurement tape
  private measureLine: THREE.Line | null = null
  private measureLineMaterial: THREE.LineBasicMaterial
  private measureAnchorRing: THREE.Mesh | null = null

  // Label sprites for measurement
  private measureLabel: THREE.Sprite | null = null
  private measureLabelCanvas: HTMLCanvasElement
  private measureLabelCtx: CanvasRenderingContext2D

  // State
  private selectedStar: StarData | null = null
  private hoveredStar: StarData | null = null
  private measureAnchor: StarData | null = null

  // Callbacks
  onStarSelect: ((star: StarData) => void) | null = null
  onStarHover: ((star: StarData | null) => void) | null = null
  onMeasure: ((result: MeasurementResult) => void) | null = null

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    starRenderer: StarRenderer,
  ) {
    this.scene = scene
    this.camera = camera
    this.starRenderer = starRenderer

    // Selection ring (bright cyan)
    this.selectionRingGeometry = new THREE.RingGeometry(1.0, 1.3, 32)
    this.selectionRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      toneMapped: false,
    })

    // Hover ring (subtle white)
    this.hoverRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      toneMapped: false,
    })

    // Measurement line (dashed yellow)
    this.measureLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.8,
      toneMapped: false,
    })

    // Label canvas for measurement distance text
    this.measureLabelCanvas = document.createElement('canvas')
    this.measureLabelCanvas.width = 512
    this.measureLabelCanvas.height = 128
    this.measureLabelCtx = this.measureLabelCanvas.getContext('2d')!
  }

  /** Raycast at the given NDC position. Returns the hit star or undefined. */
  raycast(ndcX: number, ndcY: number): StarData | undefined {
    const mesh = this.starRenderer.getMesh()
    if (!mesh) return undefined

    this.mouse.set(ndcX, ndcY)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const intersects = this.raycaster.intersectObject(mesh)
    if (intersects.length > 0 && intersects[0]!.instanceId !== undefined) {
      return this.starRenderer.getStarByIndex(intersects[0]!.instanceId)
    }
    return undefined
  }

  /** Handle hover — show subtle ring around hovered star. */
  handleHover(ndcX: number, ndcY: number): void {
    const star = this.raycast(ndcX, ndcY)

    if (star === this.hoveredStar) return

    this.hoveredStar = star ?? null
    this.updateHoverRing()
    this.onStarHover?.(this.hoveredStar)
  }

  /** Handle click — select star, or measure if Shift is held. */
  handleClick(ndcX: number, ndcY: number, shiftKey: boolean): void {
    const star = this.raycast(ndcX, ndcY)
    if (!star) return

    if (shiftKey) {
      this.handleMeasureClick(star)
    } else {
      this.select(star)
    }
  }

  /** Select a star programmatically (e.g. from search). */
  select(star: StarData): void {
    this.selectedStar = star
    this.updateSelectionRing()
    this.onStarSelect?.(star)
  }

  /** Get the currently selected star. */
  getSelected(): StarData | null {
    return this.selectedStar
  }

  /** Clear selection. */
  clearSelection(): void {
    this.selectedStar = null
    this.removeSelectionRing()
  }

  // -----------------------------------------------------------------------
  // Selection ring
  // -----------------------------------------------------------------------

  private updateSelectionRing(): void {
    this.removeSelectionRing()

    if (!this.selectedStar) return

    const { absMag } = this.selectedStar
    const starRadius = this.getVisualRadius(absMag)
    const ringScale = starRadius * 2.5

    this.selectionRing = new THREE.Mesh(
      this.selectionRingGeometry,
      this.selectionRingMaterial,
    )
    this.selectionRing.scale.setScalar(ringScale)
    this.selectionRing.position.set(
      this.selectedStar.x,
      this.selectedStar.y,
      this.selectedStar.z,
    )
    this.selectionRing.name = 'SelectionRing'
    this.scene.add(this.selectionRing)
  }

  private removeSelectionRing(): void {
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing)
      this.selectionRing = null
    }
  }

  // -----------------------------------------------------------------------
  // Hover ring
  // -----------------------------------------------------------------------

  private updateHoverRing(): void {
    this.removeHoverRing()

    if (!this.hoveredStar || this.hoveredStar === this.selectedStar) return

    const starRadius = this.getVisualRadius(this.hoveredStar.absMag)
    const ringScale = starRadius * 2.2

    this.hoverRing = new THREE.Mesh(
      this.selectionRingGeometry,
      this.hoverRingMaterial,
    )
    this.hoverRing.scale.setScalar(ringScale)
    this.hoverRing.position.set(
      this.hoveredStar.x,
      this.hoveredStar.y,
      this.hoveredStar.z,
    )
    this.hoverRing.name = 'HoverRing'
    this.scene.add(this.hoverRing)
  }

  private removeHoverRing(): void {
    if (this.hoverRing) {
      this.scene.remove(this.hoverRing)
      this.hoverRing = null
    }
  }

  // -----------------------------------------------------------------------
  // Measurement tape
  // -----------------------------------------------------------------------

  private handleMeasureClick(star: StarData): void {
    if (!this.measureAnchor) {
      // First click — set anchor
      this.measureAnchor = star
      this.clearMeasureLine()
      this.showAnchorRing(star)
    } else {
      // Second click — complete measurement
      this.completeMeasure(star)
    }
  }

  private showAnchorRing(star: StarData): void {
    this.removeAnchorRing()
    const starRadius = this.getVisualRadius(star.absMag)
    const ringScale = starRadius * 2.5

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      toneMapped: false,
    })

    this.measureAnchorRing = new THREE.Mesh(this.selectionRingGeometry, mat)
    this.measureAnchorRing.scale.setScalar(ringScale)
    this.measureAnchorRing.position.set(star.x, star.y, star.z)
    this.measureAnchorRing.name = 'MeasureAnchorRing'
    this.scene.add(this.measureAnchorRing)
  }

  private removeAnchorRing(): void {
    if (this.measureAnchorRing) {
      ;(this.measureAnchorRing.material as THREE.Material).dispose()
      this.scene.remove(this.measureAnchorRing)
      this.measureAnchorRing = null
    }
  }

  private completeMeasure(starB: StarData): void {
    const starA = this.measureAnchor!
    this.measureAnchor = null
    this.removeAnchorRing()

    const dx = starB.x - starA.x
    const dy = starB.y - starA.y
    const dz = starB.z - starA.z
    const distancePc = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const distanceLy = distancePc * PC_TO_LY

    // Draw line
    this.clearMeasureLine()
    const points = [
      new THREE.Vector3(starA.x, starA.y, starA.z),
      new THREE.Vector3(starB.x, starB.y, starB.z),
    ]
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    this.measureLine = new THREE.Line(lineGeo, this.measureLineMaterial)
    this.measureLine.name = 'MeasureLine'
    this.scene.add(this.measureLine)

    // Draw label at midpoint
    const mid = new THREE.Vector3(
      (starA.x + starB.x) / 2,
      (starA.y + starB.y) / 2 + 0.15,
      (starA.z + starB.z) / 2,
    )
    this.showMeasureLabel(mid, distancePc, distanceLy)

    const result: MeasurementResult = { starA, starB, distancePc, distanceLy }
    this.onMeasure?.(result)
  }

  private showMeasureLabel(
    position: THREE.Vector3,
    distPc: number,
    distLy: number,
  ): void {
    this.removeMeasureLabel()

    const ctx = this.measureLabelCtx
    const canvas = this.measureLabelCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.roundRect(0, 0, canvas.width, canvas.height, 12)
    ctx.fill()

    ctx.fillStyle = '#ffcc00'
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${distPc.toFixed(2)} pc  /  ${distLy.toFixed(2)} ly`,
      canvas.width / 2,
      canvas.height / 2,
    )

    const texture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    this.measureLabel = new THREE.Sprite(mat)
    this.measureLabel.position.copy(position)
    this.measureLabel.scale.set(2, 0.5, 1)
    this.measureLabel.name = 'MeasureLabel'
    this.scene.add(this.measureLabel)
  }

  private removeMeasureLabel(): void {
    if (this.measureLabel) {
      this.measureLabel.material.map?.dispose()
      this.measureLabel.material.dispose()
      this.scene.remove(this.measureLabel)
      this.measureLabel = null
    }
  }

  clearMeasureLine(): void {
    if (this.measureLine) {
      this.measureLine.geometry.dispose()
      this.scene.remove(this.measureLine)
      this.measureLine = null
    }
    this.removeAnchorRing()
    this.removeMeasureLabel()
  }

  /** Update ring billboard orientations to face camera each frame. */
  update(): void {
    const camQ = this.camera.quaternion
    if (this.selectionRing) {
      this.selectionRing.quaternion.copy(camQ)
    }
    if (this.hoverRing) {
      this.hoverRing.quaternion.copy(camQ)
    }
    if (this.measureAnchorRing) {
      this.measureAnchorRing.quaternion.copy(camQ)
    }
  }

  private getVisualRadius(absMag: number): number {
    // Import would create circular dep, so inline the formula
    const BASE = 0.03
    const SUN_MAG = 4.83
    const raw = BASE * Math.pow(10, -0.2 * (absMag - SUN_MAG))
    return Math.max(0.008, Math.min(0.12, raw))
  }

  dispose(): void {
    this.removeSelectionRing()
    this.removeHoverRing()
    this.clearMeasureLine()
    this.selectionRingGeometry.dispose()
    this.selectionRingMaterial.dispose()
    this.hoverRingMaterial.dispose()
    this.measureLineMaterial.dispose()
  }
}
