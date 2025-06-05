// src/components/three/Star.ts
import * as THREE from 'three'
// The GLTFLoader import is removed since it is not used in the code.

type Props = {
  data: {
    id: string
    color: string
    highlight: boolean
  }
  cloneOf: THREE.Group          // reeds ingeladen GLB-scene
}

export class Star extends THREE.Group {
  /** geometry/material clean-up */
  dispose() {
    this.traverse(obj => {
      const m = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[]
      const g = (obj as THREE.Mesh).geometry as THREE.BufferGeometry
      if (Array.isArray(m)) m.forEach(mat => mat.dispose())
      else if (m) m.dispose()
      g?.dispose()
    })
  }

  constructor(p: Props) {
    super()
    // gepersonaliseerde clone van de (gedeelde) GLB
    const instance = p.cloneOf.clone(true)

    const c = new THREE.Color(p.data.color)
    instance.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const apply = (mat: THREE.MeshStandardMaterial) => {
          mat.color.copy(c)
          mat.emissive.copy(c)
          mat.emissiveIntensity = p.data.highlight ? 1.2 : 0.3
          return mat
        }
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(m => apply(m.clone()))
          : apply((mesh.material as THREE.MeshStandardMaterial).clone())
      }
      child.userData = { id: p.data.id }
    })

    this.add(instance)
  }
}