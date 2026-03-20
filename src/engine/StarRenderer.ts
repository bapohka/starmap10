import * as THREE from 'three'
import type { StarData } from './StarSystem'
import { bvToRgb, spectralToBv, visualRadius } from '../math/astronomy'

// Reusable objects to avoid allocations in hot paths
const _matrix = new THREE.Matrix4()
const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _color = new THREE.Color()

/**
 * High-performance star renderer using InstancedMesh.
 * Renders all stars (except the Sun) as instanced spheres with
 * per-instance color and scale derived from astrophysical data.
 */
export class StarRenderer {
  private instancedMesh: THREE.InstancedMesh | null = null
  private geometry: THREE.SphereGeometry
  private material: THREE.MeshBasicMaterial
  private stars: StarData[] = []

  /** Map from instance index → StarData for raycasting lookups */
  private indexToStar: Map<number, StarData> = new Map()

  constructor() {
    this.geometry = new THREE.SphereGeometry(1, 12, 12)
    this.material = new THREE.MeshBasicMaterial({
      toneMapped: false,
    })
  }

  /**
   * Build or rebuild the InstancedMesh from star data.
   * Filters out the Sun (distance ≈ 0) — it gets its own special object.
   */
  build(stars: StarData[]): THREE.InstancedMesh {
    this.dispose()

    // Filter out the Sun (handled separately)
    this.stars = stars.filter((s) => s.distance > 0.001)
    const count = this.stars.length

    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count,
    )
    this.instancedMesh.name = 'StarField'
    this.indexToStar.clear()

    for (let i = 0; i < count; i++) {
      const star = this.stars[i]!
      this.indexToStar.set(i, star)

      // Position and scale
      const radius = visualRadius(star.absMag)
      _position.set(star.x, star.y, star.z)
      _scale.setScalar(radius)
      _matrix.compose(_position, _quaternion, _scale)
      this.instancedMesh.setMatrixAt(i, _matrix)

      // Color from B-V index
      const bv = star.bv !== 0 ? star.bv : spectralToBv(star.spectralType)
      const [r, g, b] = bvToRgb(bv)
      _color.setRGB(r, g, b)
      this.instancedMesh.setColorAt(i, _color)
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }

    return this.instancedMesh
  }

  /** Get StarData by instance index (used after raycasting). */
  getStarByIndex(instanceId: number): StarData | undefined {
    return this.indexToStar.get(instanceId)
  }

  /** Get all loaded stars (excluding Sun). */
  getStars(): readonly StarData[] {
    return this.stars
  }

  /** Get the InstancedMesh (null if not yet built). */
  getMesh(): THREE.InstancedMesh | null {
    return this.instancedMesh
  }

  /** Find star by name (case-insensitive partial match). */
  findByName(query: string): StarData | undefined {
    const q = query.toLowerCase()
    return this.stars.find((s) => s.name.toLowerCase().includes(q))
  }

  /** Find all stars matching a query. */
  searchByName(query: string): StarData[] {
    const q = query.toLowerCase()
    return this.stars.filter((s) => s.name.toLowerCase().includes(q))
  }

  /**
   * Apply a filter: update visible instance count and remap indices.
   * Stars not matching the predicate are moved to the end (scale 0).
   */
  applyFilter(predicate: (star: StarData) => boolean): void {
    if (!this.instancedMesh) return

    const allStars = this.stars
    this.indexToStar.clear()
    let idx = 0

    for (const star of allStars) {
      if (!predicate(star)) continue

      this.indexToStar.set(idx, star)

      const radius = visualRadius(star.absMag)
      _position.set(star.x, star.y, star.z)
      _scale.setScalar(radius)
      _matrix.compose(_position, _quaternion, _scale)
      this.instancedMesh.setMatrixAt(idx, _matrix)

      const bv = star.bv !== 0 ? star.bv : spectralToBv(star.spectralType)
      const [r, g, b] = bvToRgb(bv)
      _color.setRGB(r, g, b)
      this.instancedMesh.setColorAt(idx, _color)

      idx++
    }

    this.instancedMesh.count = idx
    this.instancedMesh.instanceMatrix.needsUpdate = true
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  dispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.dispose()
      this.instancedMesh = null
    }
    this.indexToStar.clear()
    this.stars = []
  }

  disposeAll(): void {
    this.dispose()
    this.geometry.dispose()
    this.material.dispose()
  }
}
