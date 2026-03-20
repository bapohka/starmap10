import * as THREE from 'three'

/**
 * Procedural background starfield — thousands of distant point stars
 * placed on a large sphere to simulate stars beyond the 10 pc sample.
 */
export class BackgroundStarfield {
  readonly points: THREE.Points
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial

  constructor(count = 6000, radius = 200) {
    this.geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // Uniform distribution on a sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.9 + Math.random() * 0.1) // slight depth variation

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Subtle color variation — mostly white/blue with some warm stars
      const temp = Math.random()
      if (temp < 0.6) {
        // White/blue-white
        color.setHSL(0.6 + Math.random() * 0.1, 0.15 + Math.random() * 0.2, 0.7 + Math.random() * 0.3)
      } else if (temp < 0.85) {
        // Yellow/warm
        color.setHSL(0.12 + Math.random() * 0.05, 0.3 + Math.random() * 0.3, 0.6 + Math.random() * 0.3)
      } else {
        // Orange/red
        color.setHSL(0.05 + Math.random() * 0.05, 0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3)
      }

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // Random brightness/size
      sizes[i] = 0.3 + Math.random() * 1.2
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.material = new THREE.PointsMaterial({
      size: 0.8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.createStarTexture(),
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.name = 'BackgroundStarfield'
    this.points.renderOrder = -1 // render behind everything
  }

  private createStarTexture(): THREE.Texture {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const center = size / 2

    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.4, 'rgba(200, 210, 255, 0.2)')
    gradient.addColorStop(1.0, 'rgba(200, 210, 255, 0.0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.map?.dispose()
    this.material.dispose()
  }
}
