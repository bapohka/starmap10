import * as THREE from 'three'

/**
 * Special Sun object at origin (0,0,0) with:
 * - A bright emissive sphere
 * - A billboard glow sprite (faked lens flare)
 * - A point light illuminating nearby geometry
 */
export class SunObject {
  readonly group: THREE.Group
  private sphere: THREE.Mesh
  private glowSprite: THREE.Sprite
  private pointLight: THREE.PointLight
  private glowTexture: THREE.Texture

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'Sun'

    // --- Bright sphere ---
    const sphereGeo = new THREE.SphereGeometry(0.02, 24, 24)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xfff8e7,
      toneMapped: false,
    })
    this.sphere = new THREE.Mesh(sphereGeo, sphereMat)
    this.group.add(this.sphere)

    // --- Glow sprite (procedural texture) ---
    this.glowTexture = this.createGlowTexture()
    const spriteMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xffffcc,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    this.glowSprite = new THREE.Sprite(spriteMat)
    this.glowSprite.scale.setScalar(0.25)
    this.group.add(this.glowSprite)

    // --- Second larger, fainter glow layer for lens flare effect ---
    const outerGlowMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xffeebb,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.3,
      toneMapped: false,
    })
    const outerGlow = new THREE.Sprite(outerGlowMat)
    outerGlow.scale.setScalar(0.5)
    this.group.add(outerGlow)

    // --- Third flare ring ---
    const ringGlowMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xffddaa,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.1,
      toneMapped: false,
    })
    const ringGlow = new THREE.Sprite(ringGlowMat)
    ringGlow.scale.setScalar(0.8)
    this.group.add(ringGlow)

    // --- Point light ---
    this.pointLight = new THREE.PointLight(0xfff4e0, 2, 15, 1.5)
    this.group.add(this.pointLight)
  }

  /**
   * Generate a procedural radial gradient texture for the glow effect.
   * Creates a soft, circular falloff suitable for additive blending.
   */
  private createGlowTexture(): THREE.Texture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')!
    const center = size / 2
    const gradient = ctx.createRadialGradient(
      center, center, 0,
      center, center, center,
    )

    gradient.addColorStop(0, 'rgba(255, 255, 230, 1.0)')
    gradient.addColorStop(0.1, 'rgba(255, 255, 200, 0.8)')
    gradient.addColorStop(0.3, 'rgba(255, 240, 180, 0.4)')
    gradient.addColorStop(0.6, 'rgba(255, 220, 150, 0.1)')
    gradient.addColorStop(1.0, 'rgba(255, 200, 100, 0.0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  dispose(): void {
    this.sphere.geometry.dispose()
    ;(this.sphere.material as THREE.MeshBasicMaterial).dispose()
    this.glowTexture.dispose()
    this.pointLight.dispose()

    // Dispose all sprite materials (covers glowSprite, outerGlow, ringGlow)
    this.group.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        child.material.dispose()
      }
    })
  }
}
