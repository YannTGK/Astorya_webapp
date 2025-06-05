import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Star } from './Star'
import type { StarData } from '../../types'

type MapRef = Map<string, Star>

export function useStarsManager(
  scene: THREE.Scene,
  highlightIds: string[]
) {
  /* ---------- shared GLB (één download) ---------- */
  const loader = new GLTFLoader()
  let sharedModel: THREE.Group | null = null
  const ready = loader.loadAsync(
    'https://cdn.jsdelivr.net/gh/YannTGK/GlbFIle@main/star.glb'
  ).then(gltf => {
    sharedModel = gltf.scene
  })

  /* ---------- refs & helpers ---------- */
  const refs: MapRef = new Map()
  let rafId = 0
  const spin = () => {
    refs.forEach(st => (st.rotation.z += 0.008))
    rafId = requestAnimationFrame(spin)
  }
  spin()

  /* ---------- public: update/star-diff ---------- */
  async function update(stars: StarData[]) {
    await ready
    if (!sharedModel) return

    const idSet = new Set(stars.map(s => s._id))

    // verwijder oude
    refs.forEach((star, id) => {
      if (!idSet.has(id)) {
        scene.remove(star)
        star.dispose()
        refs.delete(id)
      }
    })

    // voeg nieuwe toe
    stars.forEach(s => {
      if (!refs.has(s._id)) {
        const st = new Star({
          cloneOf: sharedModel,
          data: {
            id: s._id,
            color: s.color,
            highlight: highlightIds.includes(s._id),
          },
        })
        st.position.set(s.x, s.y, s.z)
        st.scale.set(3, 3, 3)
        scene.add(st)
        refs.set(s._id, st)
      }
    })
  }

  /* ---------- cleanup ---------- */
  function detach() {
    cancelAnimationFrame(rafId)
    refs.forEach(st => {
      scene.remove(st)
      st.dispose()
    })
    refs.clear()
  }

  return { update, detach }
}