<!-- src/components/rooms/PublicBasicRoomGL.vue -->
<template>
    <canvas ref="canvas" class="gl-canvas"></canvas>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  import * as THREE from 'three'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { gsap } from 'gsap'
  
  /* ── extern GLB ------------------------------------------------------- */
  const REMOTE_GLB =
    'https://raw.githubusercontent.com/YannTGK/GlbFIle/main/room_final.glb'
  
  /* ── props ------------------------------------------------------------ */
  const props = defineProps<{
    initialCameraPosition: [number, number, number]
    initialCameraTarget:   [number, number, number]
  }>()
  
  /* ── refs & globals --------------------------------------------------- */
  const canvas  = ref<HTMLCanvasElement>()
  let renderer : THREE.WebGLRenderer
  let scene    : THREE.Scene
  let camera   : THREE.PerspectiveCamera
  let rafId    : number
  let roomMesh : THREE.Object3D | null = null   // verwijzing naar GLB‐model
  
  /* ── helpers ---------------------------------------------------------- */
  const vec3 = (a:[number,number,number]) => new THREE.Vector3(...a)
  
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight
    if (!camera) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  
  /* ── init ------------------------------------------------------------- */
  onMounted(() => {
    if (!canvas.value) return
  
    /* renderer --------------------------------------------------------- */
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setPixelRatio(window.devicePixelRatio)
  
    /* scene ------------------------------------------------------------ */
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
  
    /* camera ----------------------------------------------------------- */
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)
    camera.position.copy(vec3(props.initialCameraPosition))
    camera.lookAt(vec3(props.initialCameraTarget))
  
    resize()
    window.addEventListener('resize', resize)
  
    /* licht ------------------------------------------------------------ */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
    hemi.position.set(0, 200, 0)
    scene.add(hemi)
  
    /* fallback-box zodat het nooit leeg is ----------------------------- */
    addBasicBoxRoom()
  
    /* GLB laden -------------------------------------------------------- */
    loadRoomGlb()
  
    /* render-loop ------------------------------------------------------ */
    const loop = () => {
      rafId = requestAnimationFrame(loop)
      renderer.render(scene, camera)
    }
    loop()
  })
  
  /* ── cleanup ---------------------------------------------------------- */
  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  
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
  
  /* ── watchers (camera animatie) -------------------------------------- */
  watch(() => props.initialCameraPosition, p => {
    if (!camera) return
    gsap.to(camera.position, { duration: 1, x: p[0], y: p[1], z: p[2] })
  })
  watch(() => props.initialCameraTarget, t => {
    if (!camera) return
    const target = vec3(t)
    gsap.to({}, { duration: 1, onUpdate: () => camera.lookAt(target) })
  })
  
  /* ── helpers ---------------------------------------------------------- */
  function addBasicBoxRoom () {
    const grp = new THREE.Group()
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0x0b1022, roughness: 0.9 })
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })
  
    const geo = new THREE.PlaneGeometry(20, 20)
    const floor = new THREE.Mesh(geo, floorMat)
    floor.rotation.x = -Math.PI / 2
    grp.add(floor)
  
    const addWall = (rx:number, ry:number, tx:number, tz:number) => {
      const w = new THREE.Mesh(geo, wallMat)
      w.rotation.set(rx, ry, 0)
      w.position.set(tx, 5, tz)
      grp.add(w)
    }
    addWall(0, 0,          0, -10)
    addWall(0, Math.PI,    0,  10)
    addWall(0,  Math.PI/2, -10, 0)
    addWall(0, -Math.PI/2,  10, 0)
  
    scene.add(grp)
  }
  
  /* GLB loader --------------------------------------------------------- */
  function loadRoomGlb () {
    const loader = new GLTFLoader()
  
    loader.load(
      REMOTE_GLB,
      gltf => {
        // verwijder box-room zodra GLB is geladen (optioneel)
        scene.clear()
        // her‐add licht nadat clear() alles weghaalde
        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  
        roomMesh = gltf.scene
        // centreer & schaal indien nodig
        roomMesh.position.set(0, 0, 0)
        scene.add(roomMesh)
      },
      xhr => {
        // progress-event (optioneel)
        // console.log(`GLB ${(xhr.loaded / xhr.total * 100).toFixed(0)} % geladen`)
      },
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