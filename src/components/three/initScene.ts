// src/components/three/initScene.ts
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

export function initScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(devicePixelRatio)
  renderer.xr.enabled = true

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  scene.fog = new THREE.Fog(0x000000, 200, 1200)

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  )
  camera.position.set(0, 0, 10)

  // ---------- bloom ----------
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      3,
      1,
      0
    )
  )

  // ---------- resize ----------
  window.addEventListener('resize', () => {
    const { innerWidth, innerHeight } = window
    renderer.setSize(innerWidth, innerHeight)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    composer.setSize(innerWidth, innerHeight)
  })

  // ---------- VR button ----------
  document.body.appendChild(VRButton.createButton(renderer))

  return { renderer, scene, camera, composer }
}