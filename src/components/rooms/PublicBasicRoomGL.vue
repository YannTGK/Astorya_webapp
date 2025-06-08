<template>
    <canvas ref="canvas" class="gl-canvas"></canvas>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  import * as THREE from 'three'
  import { GLTFLoader }   from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { gsap } from 'gsap'
  
  /* extern GLB --------------------------------------------------------- */
  const REMOTE_GLB =
    'https://raw.githubusercontent.com/YannTGK/GlbFIle/main/room_final.glb'
  
  /* props -------------------------------------------------------------- */
  const props = defineProps<{
    initialCameraPosition: [number, number, number]
    initialCameraTarget:   [number, number, number]
  }>()
  
  /* refs & globals ----------------------------------------------------- */
  const canvas   = ref<HTMLCanvasElement>()
  let renderer  : THREE.WebGLRenderer
  let scene     : THREE.Scene
  let camera    : THREE.PerspectiveCamera
  let controls  : OrbitControls
  let rafId     : number
  let roomMesh  : THREE.Object3D | null = null
  
  /* helpers ------------------------------------------------------------ */
  const vec3 = (a:[number,number,number]) => new THREE.Vector3(...a)
  
  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    if (!camera) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  
  /* ── init ------------------------------------------------------------ */
  onMounted(() => {
    if (!canvas.value) return
  
    /* renderer */
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.outputEncoding = THREE.sRGBEncoding
  
    /* scene */
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)   // witte achtergrond
  
    /* camera */
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)
    camera.position.copy(vec3(props.initialCameraPosition))
  
    /* controls */
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.target.copy(vec3(props.initialCameraTarget))
    controls.update()
  
    resize()
    window.addEventListener('resize', resize)
  
    /* basic lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
    hemi.position.set(0, 200, 0)
    scene.add(hemi)
  
    /* fallback-box zodat nooit leeg */
    addBasicBoxRoom()
  
    /* laad het echte GLB-model */
    loadRoomGlb()
  
    /* render-loop */
    const loop = () => {
      rafId = requestAnimationFrame(loop)
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
  })
  
  /* ── cleanup --------------------------------------------------------- */
  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    controls.dispose()
    renderer.dispose()
  
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose())
        else mesh.material.dispose()
        mesh.geometry.dispose()
      }
    })
  })
  
  /* ── react op prop-updates ------------------------------------------ */
  watch(() => props.initialCameraPosition, p => {
    if (!camera) return
    gsap.to(camera.position, {
      duration: 1,
      x: p[0], y: p[1], z: p[2],
      onUpdate: () => controls.update()
    })
  })
  
  watch(() => props.initialCameraTarget, t => {
    if (!camera) return
    const trg = vec3(t)
    gsap.to(controls.target, {
      duration: 1,
      x: trg.x, y: trg.y, z: trg.z,
      onUpdate: () => controls.update()
    })
  })
  
  /* ── helpers --------------------------------------------------------- */
  function addBasicBoxRoom () {
    const grp = new THREE.Group()
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0x0b1022, roughness: 0.9 })
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })
  
    const geo = new THREE.PlaneGeometry(20, 20)
  
    // vloer
    const floor = new THREE.Mesh(geo, floorMat)
    floor.rotation.x = -Math.PI / 2
    grp.add(floor)
  
    // muren
    const addWall = (rx:number, ry:number, tx:number, tz:number) => {
      const w = new THREE.Mesh(geo, wallMat)
      w.rotation.set(rx, ry, 0)
      w.position.set(tx, 5, tz)
      grp.add(w)
    }
    addWall(0, 0,          0, -10)  // achterwand
    addWall(0, Math.PI,    0,  10)  // voorwand
    addWall(0,  Math.PI/2, -10, 0)  // links
    addWall(0, -Math.PI/2,  10, 0)  // rechts
  
    scene.add(grp)
  }
  
  function loadRoomGlb () {
    const loader = new GLTFLoader()
    loader.load(
      REMOTE_GLB,
      gltf => {
        scene.clear()                         // verwijder fallback
        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  
        roomMesh = gltf.scene
        roomMesh.position.set(0, 0, 0)
        scene.add(roomMesh)
      },
      undefined,
      err => console.error('GLB laden mislukt:', err),
    )
  }
  </script>
  
  <style scoped>
  .gl-canvas {
    position: fixed;
    inset: 0;
    display: block;
  }
  </style>