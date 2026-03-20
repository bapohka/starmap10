import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CameraManager } from './CameraManager'
import { StarRenderer } from './StarRenderer'
import { SunObject } from './SunObject'
import { InteractionManager } from './InteractionManager'
import { BackgroundStarfield } from './BackgroundStarfield'
import { StarLabels } from './StarLabels'
import type { StarData } from './StarSystem'

export class SceneManager {
  readonly scene: THREE.Scene
  readonly renderer: THREE.WebGLRenderer
  readonly cameraManager: CameraManager
  readonly controls: OrbitControls
  readonly starRenderer: StarRenderer
  readonly sun: SunObject
  readonly interaction: InteractionManager
  readonly backgroundStarfield: BackgroundStarfield
  readonly starLabels: StarLabels

  private composer: EffectComposer
  private animationId: number | null = null
  private clock = new THREE.Clock()
  private ambientLight: THREE.AmbientLight
  private grid: THREE.GridHelper
  private canvas: HTMLCanvasElement
  private onContextLost: (e: Event) => void
  private onContextRestored: () => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000008)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })

    // Handle WebGL context loss/restore
    this.onContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('WebGL context lost — rendering paused')
      this.stop()
    }
    this.onContextRestored = () => {
      console.info('WebGL context restored — resuming rendering')
      this.start()
    }
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    this.cameraManager = new CameraManager(canvas.clientWidth / canvas.clientHeight)

    this.controls = new OrbitControls(this.cameraManager.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 50

    // Link controls to CameraManager for fly-to
    this.cameraManager.setControls(this.controls)

    // Sun at the origin
    this.sun = new SunObject()
    this.scene.add(this.sun.group)

    // Background starfield
    this.backgroundStarfield = new BackgroundStarfield()
    this.scene.add(this.backgroundStarfield.points)

    // Star field renderer
    this.starRenderer = new StarRenderer()

    // Star labels (proximity-based)
    this.starLabels = new StarLabels()
    this.scene.add(this.starLabels.group)

    // Interaction manager
    this.interaction = new InteractionManager(
      this.scene,
      this.cameraManager.camera,
      this.starRenderer,
    )

    // Post-processing: bloom
    const resolution = new THREE.Vector2(canvas.clientWidth, canvas.clientHeight)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.cameraManager.camera))
    this.composer.addPass(new UnrealBloomPass(resolution, 0.6, 0.4, 0.85))
    this.composer.addPass(new OutputPass())

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.ambientLight)

    // Grid helper
    this.grid = new THREE.GridHelper(24, 24, 0x222244, 0x111133)
    ;(this.grid.material as THREE.Material).transparent = true
    ;(this.grid.material as THREE.Material).opacity = 0.3
    this.scene.add(this.grid)
  }

  /** Load star data into the instanced renderer. */
  loadStars(stars: StarData[]): void {
    const mesh = this.starRenderer.build(stars)
    this.scene.add(mesh)
    this.starLabels.build(stars)
  }

  /** Toggle showing all star labels. */
  setShowAllLabels(v: boolean): void {
    this.starLabels.setShowAll(v)
  }

  /** Apply a filter predicate to show/hide stars. */
  applyFilter(predicate: (star: StarData) => boolean): void {
    this.starRenderer.applyFilter(predicate)
  }

  /** Fly the camera smoothly to a star's position. */
  flyToStar(star: StarData): void {
    const target = new THREE.Vector3(star.x, star.y, star.z)
    this.cameraManager.flyTo(target)
  }

  start(): void {
    this.clock.start()
    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate)

      try {
        const delta = this.clock.getDelta()

        // Update camera fly-to animation
        const isFlying = this.cameraManager.update(delta)

        // Only let OrbitControls update when not flying
        if (!isFlying) {
          this.controls.update()
        }

        // Billboard rings to face camera
        this.interaction.update()

        // Update proximity labels
        this.starLabels.update(this.cameraManager.camera)

        // Render with post-processing
        this.composer.render()
      } catch (err) {
        console.error('Render loop error:', err)
        this.stop()
      }
    }
    animate()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return
    this.cameraManager.setAspect(width / height)
    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
  }

  dispose(): void {
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    this.controls.dispose()
    this.interaction.dispose()
    this.starRenderer.disposeAll()
    this.sun.dispose()
    this.backgroundStarfield.dispose()
    this.starLabels.dispose()
    this.ambientLight.dispose()
    this.grid.geometry.dispose()
    ;(this.grid.material as THREE.Material).dispose()
    this.composer.dispose()
    this.renderer.dispose()
  }
}
