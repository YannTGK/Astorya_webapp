<!-- src/views/Sky.vue -->
<template>
    <!-- ══════ HEADER / SEARCH ─────────────────────────── -->
    <header class="topbar">
      <div class="field" v-if="!panelOpen">
        <input
          v-model="searchTerm"
          class="compact-input"
          type="text"
          placeholder="Search…"
          @focus="panelOpen = true"
        />
      </div>
    </header>
  
    <!-- ══════ SLIDE-IN PANEL ─────────────────────────── -->
    <Transition name="slide">
      <aside v-if="panelOpen" class="panel">
        <div class="search-holder">
          <div class="field" style="flex:1">
            <input
              v-model="searchTerm"
              class="compact-input"
              type="text"
              placeholder="Star name…"
              @keydown.stop
            />
            <ul v-if="suggestions.length" class="suggest">
              <li v-for="s in suggestions" :key="s._id" @click="focusStar(s)">
                {{ s.publicName }}
              </li>
            </ul>
          </div>
          <button class="icon-btn" @click="togglePanel"><span>x</span></button>
        </div>
  
        <!-- Toggle onlyMine -->
        <div class="horizontalRow">
          <div class="switchRow">
            <span>Show only my stars</span>
            <label class="switch">
              <input type="checkbox" v-model="onlyMine" />
              <span class="slider"></span>
            </label>
          </div>
          <span class="hint">
            Turn this on to hide all unknown public stars and show only those from
            your family and friends in the starry sky.
          </span>
        </div>
  
        <!-- Date filters -->
        <label class="label">Date of birth
          <input v-model="dob" type="date" class="full-input" />
        </label>
  
        <label class="label">Date of death
          <input v-model="dod" type="date" class="full-input" />
        </label>
  
        <!-- Country -->
        <label class="label">Country
          <select v-model="country" class="full-input">
            <option value="">All</option>
            <option value="Belgium">Belgium</option>
            <option value="Netherlands">Netherlands</option>
          </select>
        </label>
  
        <!-- Coordinate -->
        <label class="label">Coordinate
          <input v-model="coord" placeholder="X,Y,Z" class="full-input" />
        </label>
  
        <button class="filterBtn" @click="applyFilters">Filter</button>
      </aside>
    </Transition>
  
    <!-- ══════ CANVAS ─────────────────────────────────── -->
    <canvas
      ref="canvas"
      class="sky-canvas"
      @pointerdown="startLook"
      @pointermove="lookAround"
      @pointerleave="stopLook"
    />
  
    <!-- Ster-naam overlay -->
    <Transition name="fade">
      <div v-if="focusedName" class="star-label">{{ focusedName }}</div>
    </Transition>
  
    <!-- Geen-toegang overlay -->
    <Transition name="fade">
      <div v-if="noAccessMsg" class="access-label">{{ noAccessMsg }}</div>
    </Transition>
  
    <!-- Reset-camera knop -->
    <button class="reset-btn" @click="resetView" title="Reset view">↺</button>
  
    <!-- Meldingen -->
    <div v-if="errorMsg" class="err">
      {{ errorMsg }} – <button @click="reload">retry</button>
    </div>
    <div v-else-if="loading" class="spinner">Loading…</div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
  import * as THREE from 'three'
  import { gsap } from 'gsap'
  import { initScene } from '../components/three/initScene'
  import { useStarsManager } from '../components/three/StarsManager'
  import { useStars } from '../composables/useStars'
  import api from '../lib/axios'
  import { router } from '../router'
  import type { StarData } from '../types'
  
  /* ─── UI-state ─────────────────────────────────────── */
  const panelOpen = ref(false)
  const searchTerm = ref('')
  const onlyMine = ref(false)
  const dob = ref('')
  const dod = ref('')
  const country = ref('')
  const coord = ref('')
  const togglePanel = () => (panelOpen.value = !panelOpen.value)
  
  /* overlays & timers */
  const focusedName = ref('')
  const noAccessMsg = ref('')
  let labelTimer: any = null
  let msgTimer: any = null
  const activeStar = ref<StarData | null>(null)
  
  /* ─── Data ─────────────────────────────────────────── */
  const { stars, loading, errorMsg, reload } = useStars()
  const near = (v: number, t: number, m = 2) => Math.abs(v - t) <= m
  
  const filteredStars = computed<StarData[]>(() => {
    let arr = [...stars.value]
    if (onlyMine.value) arr = arr.filter((s) => s.related)
    if (dob.value) arr = arr.filter((s) => s.user?.dob?.slice(0, 10) === dob.value)
    if (dod.value) arr = arr.filter((s) => s.user?.dod?.slice(0, 10) === dod.value)
    if (country.value) arr = arr.filter((s) => s.user?.country === country.value)
    if (coord.value) {
      const [x, y, z] = coord.value.split(',').map(Number)
      if (!isNaN(x)) arr = arr.filter((s) => near(s.x, x))
      if (!isNaN(y)) arr = arr.filter((s) => near(s.y, y))
      if (!isNaN(z)) arr = arr.filter((s) => near(s.z, z))
    }
    if (searchTerm.value.trim()) {
      const q = searchTerm.value.toLowerCase()
      arr = arr.filter((s) => s.publicName.toLowerCase().includes(q))
    }
    return arr
  })
  
  const suggestions = computed(() =>
    searchTerm.value.trim()
      ? stars.value
          .filter((s) =>
            s.publicName.toLowerCase().includes(searchTerm.value.toLowerCase())
          )
          .slice(0, 8)
      : []
  )
  
  function applyFilters() {} // filters werken al reactief
  
  /* ─── Three.js setup ──────────────────────────────── */
  const DEFAULT_POS = new THREE.Vector3(0, 0, 10)
  const camPos = ref(DEFAULT_POS.clone())
  const camRot = ref({ x: 0, y: 0 })
  const FOCUS = 20 // Z-offset
  
  const canvas = ref<HTMLCanvasElement>()
  let renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    composer: any,
    starMgr: ReturnType<typeof useStarsManager> | null = null
  
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  
  onMounted(() => {
    if (!canvas.value) return
    ;({ renderer, scene, camera, composer } = initScene(canvas.value))
  
    /* achtergrondpuntjes */
    const pts = new Float32Array(1000 * 3).map(() => (Math.random() - 0.5) * 2000)
    scene.add(
      new THREE.Points(
        new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.BufferAttribute(pts, 3)
        ),
        new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, opacity: 0.8 })
      )
    )
  
    /* sterren-manager */
    starMgr = useStarsManager(scene, [])
    watch(filteredStars, (s) => starMgr!.update(s), { immediate: true })
  
    renderer.setAnimationLoop(() => {
      camera.position.copy(camPos.value)
      camera.rotation.set(camRot.value.x, camRot.value.y, 0)
      composer.render()
    })
  })
  
  onUnmounted(() => {
    renderer?.setAnimationLoop(null)
    starMgr?.detach()
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKey)
  })
  
  /* ─── Focus op ster (eerste klik) ─────────────────── */
  function focusStar(star: StarData) {
    const target = new THREE.Vector3(star.x, star.y, star.z)
    const newPos = new THREE.Vector3(star.x, star.y + FOCUS, star.z )
  
    const tmp = new THREE.PerspectiveCamera()
    tmp.position.copy(newPos)
    tmp.lookAt(target)
    gsap.to(camPos.value, { duration: 1, x: newPos.x, y: newPos.y, z: newPos.z })
    gsap.to(camRot.value, { duration: 1, x: tmp.rotation.x, y: tmp.rotation.y })
  
    focusedName.value = star.publicName
    clearTimeout(labelTimer)
    labelTimer = setTimeout(() => (focusedName.value = ''), 4000)
  
    activeStar.value = star
    panelOpen.value = false
    searchTerm.value = ''
  }
  
  /* ─── Reset-knop ──────────────────────────────────── */
  function resetView() {
    focusedName.value = ''
    activeStar.value = null
    gsap.to(camPos.value, {
      duration: 0.8,
      x: DEFAULT_POS.x,
      y: DEFAULT_POS.y,
      z: DEFAULT_POS.z,
    })
    gsap.to(camRot.value, { duration: 0.8, x: 0, y: 0 })
  }
  
  /* ─── Drag/look controls ─────────────────────────── */
  const inputActive = () => !!document.activeElement?.closest('input,select')
  const canControl = () => !panelOpen.value && !inputActive()
  
  const dragging = ref(false),
    rotating = ref(false)
  let px = 0,
    py = 0,
    startX = 0,
    startY = 0
  const THRESH = 8
  
  function startLook(e: PointerEvent) {
    if (!canControl() || e.button !== 0) return
    dragging.value = true
    rotating.value = false
    startX = px = e.clientX
    startY = py = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function lookAround(e: PointerEvent) {
    if (!dragging.value || !canControl()) return
    if ((e.buttons & 1) === 0) {
      stopLook(e)
      return
    }
    const dx = e.clientX - px,
      dy = e.clientY - py
    px = e.clientX
    py = e.clientY
    if (!rotating.value && Math.hypot(e.clientX - startX, e.clientY - startY) > THRESH)
      rotating.value = true
    if (rotating.value) {
      const sp = 0.002
      camRot.value.y -= dx * sp
      camRot.value.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, camRot.value.x - dy * sp)
      )
    }
  }
  function stopLook(e: PointerEvent) {
    if (!dragging.value) return
    if (!rotating.value) handleClick(e)
    dragging.value = false
    rotating.value = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }
  
  /* ─── Klik­handler met toegang-check ─────────────── */
  async function handleClick(e: PointerEvent) {
    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find((h) => h.object.userData?.id)
    if (!hit) return
  
    const star = stars.value.find((s) => s._id === hit.object.userData.id)
    if (!star) return
  
    /* tweede klik → probeer 3-D room */
    if (activeStar.value && activeStar.value._id === star._id) {
      try {
        const { data } = await api.get(`/stars/${star._id}/three-d-rooms`)
        if (Array.isArray(data) && data.length > 0) {
          router.push({ name: 'Room', params: { starId: star._id } })
        } else {
          throw new Error('no access')
        }
      } catch {
        noAccessMsg.value = 'This is a dedicated star of somewone else. You can only view it in 3D if you are family or friends.'
        clearTimeout(msgTimer)
        msgTimer = setTimeout(() => (noAccessMsg.value = ''), 3000)
      }
      return
    }
  
    /* eerste klik → focus */
    focusStar(star)
  }
  
  /* ─── WASD-move ───────────────────────────────────── */
  const mv = { f: 0, b: 0, l: 0, r: 0 },
    SPEED = 0.6
  function onKey(e: KeyboardEvent) {
    if (!canControl()) return
    const v = e.type === 'keydown' ? 1 : 0
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        mv.f = v
        break
      case 's':
      case 'arrowdown':
        mv.b = v
        break
      case 'a':
      case 'arrowleft':
        mv.l = v
        break
      case 'd':
      case 'arrowright':
        mv.r = v
        break
    }
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  requestAnimationFrame(function step() {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(
      new THREE.Euler(camRot.value.x, camRot.value.y)
    )
    const right = new THREE.Vector3(1, 0, 0).applyEuler(
      new THREE.Euler(camRot.value.x, camRot.value.y)
    )
    if (canControl()) {
      camPos.value.addScaledVector(fwd, (mv.f - mv.b) * SPEED)
      camPos.value.addScaledVector(right, (mv.r - mv.l) * SPEED)
    }
    requestAnimationFrame(step)
  })
  </script>
  
  <style scoped>
  /* topbar */
  .topbar {
    position: fixed;
    top: 24px;
    left: 20px;
    display: flex;
    gap: 8px;
    z-index: 30;
  }
  .compact-input {
    width: 160px;
    padding: 6px 10px;
    border-radius: 20px;
    border: none;
    outline: none;
    background: #fff;
  }
  
  /* panel / filters */
  .slide-enter-from {
    transform: translateX(-100%);
  }
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }
  .slide-leave-to {
    transform: translateX(-100%);
  }
  .panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100vh;
    padding: 24px 20px 32px;
    background: #0c1027;
    color: #fff;
    z-index: 25;
    overflow-y: auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
  }
  .search-holder {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .field {
    position: relative;
  }
  .suggest {
    position: absolute;
    top: 42px;
    left: 0;
    right: 0;
    background: #1a1f3d;
    border-radius: 6px;
    max-height: 160px;
    overflow-y: auto;
    padding: 4px 0;
    z-index: 10;
  }
  .suggest li {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
  }
  .suggest li:hover {
    background: #252b52;
  }
  .hint {
    font-size: 12px;
    line-height: 1.3;
    color: #aaa;
  }
  .full-input,
  select {
    width: auto;
    padding: 10px 12px;
    margin: 12px 0;
    border-radius: 6px;
    border: none;
    outline: none;
  }
  .horizontalRow {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 0;
  }
  .switchRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 12px 0;
  }
  .switch {
    position: relative;
    width: 40px;
    height: 20px;
  }
  .switch input {
    display: none;
  }
  .slider {
    position: absolute;
    inset: 0;
    background: #555;
    border-radius: 10px;
    cursor: pointer;
    transition: 0.25s;
  }
  .slider::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    top: 2px;
    left: 2px;
    transition: 0.25s;
  }
  .switch input:checked + .slider {
    background: #fedf7e;
  }
  .switch input:checked + .slider::after {
    transform: translateX(20px);
  }
  .label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    margin: 12px 0 0;
  }
  .filterBtn {
    width: 100%;
    padding: 10px 0;
    margin-top: 8px;
    border: none;
    border-radius: 6px;
    background: #fedf7e;
    color: #111;
    font-weight: 600;
    cursor: pointer;
  }
  
  /* canvas & HUD */
  .sky-canvas {
    position: fixed;
    inset: 0;
    display: block;
    cursor: grab;
    touch-action: none;
  }
  .sky-canvas:active {
    cursor: grabbing;
  }
  .err {
    position: fixed;
    top: 20px;
    left: 20px;
    color: #e33;
    background: rgba(0, 0, 0, 0.65);
    padding: 6px 10px;
    border-radius: 4px;
    z-index: 40;
  }
  .spinner {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-family: sans-serif;
  }
  
  /* overlays */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .star-label {
    position: fixed;
    bottom: 150px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    border-radius: 20px;
    background: #000a;
    color: #fedf7e;
    font-size: 18px;
    font-weight: 600;
    pointer-events: none;
    z-index: 35;
  }
  .access-label {
    position: fixed;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    border-radius: 20px;
    background: #c00d;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    pointer-events: none;
    z-index: 36;
  }
  
  /* reset-button */
  .reset-btn {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: #fff;
    color: #111;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    transition: 0.25s;
    z-index: 35;
  }
  .reset-btn:hover {
    transform: scale(1.05);
  }
  .reset-btn:active {
    transform: scale(0.95);
  }
  </style>