import * as THREE from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const FLY_DURATION = 1.5 // seconds
const FLY_OFFSET = 1.2   // distance from target when arriving

export class CameraManager {
  readonly camera: THREE.PerspectiveCamera

  // Fly-to animation state
  private isFlying = false
  private flyStart = new THREE.Vector3()
  private flyEnd = new THREE.Vector3()
  private flyTargetLookAt = new THREE.Vector3()
  private flyStartLookAt = new THREE.Vector3()
  private flyProgress = 0
  private flyDuration = FLY_DURATION
  private controls: OrbitControls | null = null

  // Reusable vector for update loop (avoids per-frame allocation)
  private readonly _currentLookAt = new THREE.Vector3()

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 200)
    this.camera.position.set(0, 5, 15)
    this.camera.lookAt(0, 0, 0)
  }

  /** Store OrbitControls reference for fly-to target updates. */
  setControls(controls: OrbitControls): void {
    this.controls = controls
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  /**
   * Smoothly fly the camera to look at a target position.
   * Camera ends up at an offset distance from the target.
   */
  flyTo(target: THREE.Vector3, duration = FLY_DURATION): void {
    this.flyStart.copy(this.camera.position)

    // Compute end position: offset along the direction from target to current camera
    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, target)
      .normalize()
    // If camera is very close or at the same spot, pick a default direction
    if (dir.lengthSq() < 0.001) {
      dir.set(0, 0.5, 1).normalize()
    }
    this.flyEnd.copy(target).addScaledVector(dir, FLY_OFFSET)

    this.flyTargetLookAt.copy(target)

    // Current look-at: approximate from controls target or forward direction
    if (this.controls) {
      this.flyStartLookAt.copy(this.controls.target)
    } else {
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
      this.flyStartLookAt.copy(this.camera.position).add(fwd)
    }

    this.flyProgress = 0
    this.flyDuration = duration
    this.isFlying = true
  }

  /**
   * Must be called each frame. Returns true if camera is animating.
   * delta is in seconds.
   */
  update(delta: number): boolean {
    if (!this.isFlying) return false

    this.flyProgress += delta / this.flyDuration
    const t = Math.min(this.flyProgress, 1)

    // Smooth ease-in-out (cubic)
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2

    // Interpolate camera position
    this.camera.position.lerpVectors(this.flyStart, this.flyEnd, ease)

    // Interpolate look-at target (reuse vector to avoid per-frame allocation)
    this._currentLookAt.lerpVectors(
      this.flyStartLookAt,
      this.flyTargetLookAt,
      ease,
    )

    // Update controls target so OrbitControls pivots around the star
    if (this.controls) {
      this.controls.target.copy(this._currentLookAt)
    }

    if (t >= 1) {
      this.isFlying = false
    }

    return true
  }

  /** Whether the camera is currently in a fly-to animation. */
  get flying(): boolean {
    return this.isFlying
  }

  /** Immediately stop any fly-to animation. */
  stopFly(): void {
    this.isFlying = false
  }
}
