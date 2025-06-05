// src/components/three/Star.ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type Props = {
  position: [number, number, number]
  size: [number, number, number]
  id: string
  color: THREE.Color
  emissive: THREE.Color
  highlight: boolean
}

export class Star extends THREE.Object3D {
  constructor(p: Props) {
    super()
    this.position.set(...p.position)
    this.rotation.x = -Math.PI / 2
    this.userData = { id: p.id, color: p.color, emissive: p.emissive }
    this.load(p.size, p.color, p.emissive, p.highlight)
  }

  private load(size: [number, number, number], c: THREE.Color, e: THREE.Color, hi: boolean) {
    const loader = new GLTFLoader()
    loader.load(
      'https://cdn.jsdelivr.net/gh/YannTGK/GlbFIle@main/star.glb',
      (g) => {
        g.scene.scale.set(...size)
        g.scene.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh && mesh.material) {
            const apply = (m: THREE.MeshStandardMaterial) => {
              m.color.copy(c)
              m.emissive.copy(e)
              m.emissiveIntensity = hi ? 0.3 : 0.3
              return m
            }
            mesh.material = Array.isArray(mesh.material)
              ? mesh.material.map((m) => apply(m.clone()))
              : apply(mesh.material.clone())
          }
          child.userData = { ...child.userData, ...this.userData }
        })
        this.add(g.scene)
      }
    )
  }
}