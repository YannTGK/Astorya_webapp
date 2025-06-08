// src/components/three/initScene.ts
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'

export function initScene(canvas: HTMLCanvasElement) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.xr.enabled = true                                 // ← WebXR aan

  // Voeg de “Enter VR” knop toe
  document.body.appendChild(VRButton.createButton(renderer))

  // Scene & Fog
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  scene.fog = new THREE.Fog(0x000000, 200, 1200)
  
   // ── voeg dit toe ──
  // Basis omgevingslicht, zodat alle objecten minimaal een beetje verlicht zijn
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  // Richtingslicht voor diepte en schaduwwerking (bijv. controllers)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(10, 10, 10)  // vanaf boven/rechts
  scene.add(directionalLight)
  // ───────────────────
  
  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  )
  camera.position.set(0, 0, 10)

  // Post-processing (bloom)
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      3, 1, 0
    )
  )

  // Controllers (optioneel)
  const controllerModelFactory = new XRControllerModelFactory()
  const ctrlGrip = (i: number) => {
    const ctrl = renderer.xr.getController(i)
    scene.add(ctrl)
    const grip = renderer.xr.getControllerGrip(i)
    grip.add(controllerModelFactory.createControllerModel(grip))
    scene.add(grip)
  }
  ctrlGrip(0)
  ctrlGrip(1)

  // Resize-handler
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    composer.setSize(w, h)
  })

  return { renderer, scene, camera, composer }
}