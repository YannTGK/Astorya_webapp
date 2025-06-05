// src/components/three/StarsManager.ts
import * as THREE from 'three'
import { Star } from './Star'

type D = { _id:string; x:number; y:number; z:number; color:string }
export function useStarsManager(
  scene: THREE.Scene,
  stars: D[],
  highlightIds: string[]
){
  const refs: Star[] = []

  stars.forEach(s => {
    const st = new Star({
      position:[s.x,s.y,s.z],
      size:[3,3,3],
      id:s._id,
      color:new THREE.Color(s.color),
      emissive:new THREE.Color(s.color),
      highlight:highlightIds.includes(s._id),
    })
    scene.add(st); refs.push(st)
  })

  // simpele spin-animatie
  let frame = 0
  const spin = () => { refs.forEach(st => (st.rotation.z += 0.008)); frame = requestAnimationFrame(spin) }
  spin()

  /* ⬅️ belangrijk: return cleanup */
  return () => {
    cancelAnimationFrame(frame)
    refs.forEach(st => scene.remove(st))
  }
}