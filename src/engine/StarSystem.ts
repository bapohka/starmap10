import * as THREE from 'three'
import { spectralToHex, bvToHex, visualRadius } from '../math/astronomy'

export interface StarData {
  id: string
  name: string
  ra: number          // Right Ascension (degrees)
  dec: number         // Declination (degrees)
  parallax: number    // mas
  distance: number    // parsecs
  appMag: number      // apparent magnitude (G-band)
  absMag: number      // absolute magnitude
  bv: number          // B-V color index
  luminosity: number  // L/L☉
  spectralType: string
  temperature: number // effective temperature (K)
  x: number           // cartesian (pc)
  y: number
  z: number
}

export class StarSystem {
  readonly mesh: THREE.Mesh
  readonly data: StarData

  constructor(data: StarData) {
    this.data = data

    const radius = visualRadius(data.absMag)
    const colorHex = data.bv !== 0
      ? bvToHex(data.bv)
      : spectralToHex(data.spectralType)

    const geometry = new THREE.SphereGeometry(radius, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(data.x, data.y, data.z)
    this.mesh.userData = { starId: data.id }
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
