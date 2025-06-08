<template>
  <!-- HEADER / SEARCH -->
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

  <!-- SLIDE-IN PANEL -->
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
      <!-- filters… -->
      <div class="horizontalRow">
        <div class="switchRow">
          <span>Show only my stars</span>
          <label class="switch">
            <input type="checkbox" v-model="onlyMine" />
            <span class="slider"></span>
          </label>
        </div>
        <span class="hint">
          Turn this on to hide all public stars you don’t own.
        </span>
      </div>
      <label class="label">Date of birth
        <input v-model="dob" type="date" class="full-input" />
      </label>
      <label class="label">Date of death
        <input v-model="dod" type="date" class="full-input" />
      </label>
      <label class="label">Country
        <select v-model="country" class="full-input">
          <option value="">All</option>
          <option>Belgium</option>
          <option>Netherlands</option>
        </select>
      </label>
      <label class="label">Coordinate
        <input v-model="coord" placeholder="X,Y,Z" class="full-input" />
      </label>
      <button class="filterBtn" @click="applyFilters">Filter</button>
    </aside>
  </Transition>

  <!-- VR CANVAS -->
  <canvas
    ref="canvas"
    class="sky-canvas"
    @pointerdown="startLook"
    @pointermove="lookAround"
    @pointerleave="stopLook"
  />

  <!-- OVERLAYS -->
  <Transition name="fade">
    <div v-if="focusedName" class="star-label">{{ focusedName }}</div>
  </Transition>
  <Transition name="fade">
    <div v-if="noAccessMsg" class="access-label">{{ noAccessMsg }}</div>
  </Transition>
  <button class="reset-btn" @click="resetView">↺</button>
  <div v-if="errorMsg" class="err">
    {{ errorMsg }} – <button @click="reload">retry</button>
  </div>
  <div v-else-if="loading" class="spinner">Loading…</div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { initScene } from '../components/three/initScene'
import { useStarsManager } from '../components/three/StarsManager'
import { useStars } from '../composables/useStars'
import api from '../lib/axios'
import { router } from '../router'
import type { StarData } from '../types'

// UI state & filters
const panelOpen  = ref(false)
const searchTerm = ref('')
const onlyMine   = ref(false)
const dob        = ref('')
const dod        = ref('')
const country    = ref('')
const coord      = ref('')
const togglePanel = () => (panelOpen.value = !panelOpen.value)

const { stars, loading, errorMsg, reload } = useStars()
const near = (v: number, t: number, m = 2) => Math.abs(v - t) <= m

const filteredStars = computed<StarData[]>(() => {
  let arr = [...stars.value]
  if (onlyMine.value) arr = arr.filter(s => s.related)
  if (dob.value)      arr = arr.filter(s => s.user?.dob?.slice(0,10) === dob.value)
  if (dod.value)      arr = arr.filter(s => s.user?.dod?.slice(0,10) === dod.value)
  if (country.value)  arr = arr.filter(s => s.user?.country === country.value)
  if (coord.value) {
    const [x,y,z] = coord.value.split(',').map(Number)
    if (!isNaN(x)) arr = arr.filter(s => near(s.x, x))
    if (!isNaN(y)) arr = arr.filter(s => near(s.y, y))
    if (!isNaN(z)) arr = arr.filter(s => near(s.z, z))
  }
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase()
    arr = arr.filter(s => s.publicName.toLowerCase().includes(q))
  }
  return arr
})

const suggestions = computed(() =>
  searchTerm.value.trim()
    ? stars.value
        .filter(s => s.publicName.toLowerCase().includes(searchTerm.value.toLowerCase()))
        .slice(0,8)
    : []
)

function applyFilters() { /* reactive */ }

// overlays & timers
const focusedName = ref('')
const noAccessMsg = ref('')
let labelTimer: any = null
let msgTimer: any   = null
const activeStar = ref<StarData|null>(null)

// Three.js + XR setup
const DEFAULT_POS = new THREE.Vector3(0,0,10)
const camPos = ref(DEFAULT_POS.clone())
const camRot = ref({ x:0, y:0 })
const FOCUS = 20
const SPEED = 0.1 // thumbstick speed

const canvas = ref<HTMLCanvasElement>()
let renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    composer: any,
    starMgr: ReturnType<typeof useStarsManager>

const raycaster = new THREE.Raycaster()
const mouse     = new THREE.Vector2()

onMounted(() => {
  if (!canvas.value) return

  // init scene + bloom composer
  ;({ renderer, scene, camera, composer } = initScene(canvas.value))

  // VR button
  document.body.appendChild(VRButton.createButton(renderer))

  // controllers & hand models
  const ctrlFactory = new XRControllerModelFactory()
  const handFactory = new XRHandModelFactory()

  // two controllers
  for (let i = 0; i < 2; i++) {
    const grip = renderer.xr.getControllerGrip(i)
    grip.add(ctrlFactory.createControllerModel(grip))
    scene.add(grip)

    const hand = renderer.xr.getHand(i)
    hand.add(handFactory.createHandModel(hand, 'mesh'))
    scene.add(hand)
  }

  // add some random points
  const pts = new Float32Array(1000*3).map(() => (Math.random()-0.5)*2000)
  scene.add(new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts,3)),
    new THREE.PointsMaterial({ color:0xffffff, size:1.5, opacity:0.8 })
  ))

  // stars manager
  starMgr = useStarsManager(scene, [])
  watch(filteredStars, s => starMgr.update(s), { immediate: true })

  // render loop
  renderer.setAnimationLoop((time) => {
    // update camera
    camera.position.copy(camPos.value)
    camera.rotation.set(camRot.value.x, camRot.value.y, 0)

    // thumbstick movement (right hand)
    const session = renderer.xr.getSession()
    if (session) {
      for (const src of session.inputSources) {
        if (src.gamepad && src.handedness === 'right') {
          const [xAxis, yAxis] = src.gamepad.axes
          if (Math.abs(yAxis) > 0.2) {
            // forward/back
            const dir = new THREE.Vector3(0,0, -yAxis * SPEED).applyEuler(camera.rotation)
            camPos.value.add(dir)
          }
          if (Math.abs(xAxis) > 0.2) {
            // strafe
            const dir = new THREE.Vector3(xAxis * SPEED,0,0).applyEuler(camera.rotation)
            camPos.value.add(dir)
          }
        }
      }
    }

    if (renderer.xr.isPresenting) {
      console.log('VR frame', time)
      renderer.render(scene, camera)
    } else {
      composer.render()
    }
  })
})

onUnmounted(() => {
  renderer.setAnimationLoop(null)
  starMgr.detach()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
})

// focus, reset, pointer, keyboard… same as before
function focusStar(star: StarData) {
  const target = new THREE.Vector3(star.x, star.y, star.z)
  const newPos = new THREE.Vector3(star.x, star.y + FOCUS, star.z)
  const tmp = new THREE.PerspectiveCamera()
  tmp.position.copy(newPos)
  tmp.lookAt(target)
  gsap.to(camPos.value, { duration:1, x:newPos.x, y:newPos.y, z:newPos.z })
  gsap.to(camRot.value, { duration:1, x:tmp.rotation.x, y:tmp.rotation.y })
  focusedName.value = star.publicName
  clearTimeout(labelTimer)
  labelTimer = setTimeout(()=> focusedName.value='',4000)
  activeStar.value = star
  panelOpen.value = false
  searchTerm.value = ''
}
function resetView() {
  focusedName.value = ''
  activeStar.value = null
  gsap.to(camPos.value, { duration:0.8, x:DEFAULT_POS.x, y:DEFAULT_POS.y, z:DEFAULT_POS.z })
  gsap.to(camRot.value, { duration:0.8, x:0, y:0 })
}

const inputActive = () => !!document.activeElement?.closest('input,select')
const canControl  = () => !panelOpen.value && !inputActive()

let dragging= ref(false), rotating= ref(false)
let px=0, py=0, startX=0, startY=0
const THRESH = 8

function startLook(e: PointerEvent) {
  if (!canControl() || e.button!==0) return
  dragging.value = true; rotating.value = false
  startX=px=e.clientX; startY=py=e.clientY
  (e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function lookAround(e: PointerEvent) {
  if (!dragging.value||!canControl()) return
  if ((e.buttons&1)===0) { stopLook(e); return }
  const dx=e.clientX-px, dy=e.clientY-py
  px=e.clientX; py=e.clientY
  if (!rotating.value && Math.hypot(e.clientX-startX,e.clientY-startY)>THRESH)
    rotating.value = true
  if (rotating.value) {
    const sp=0.002
    camRot.value.y -= dx*sp
    camRot.value.x = Math.max(-Math.PI/2+0.05,Math.min(Math.PI/2-0.05,camRot.value.x-dy*sp))
  }
}
function stopLook(e: PointerEvent) {
  if (!dragging.value) return
  if (!rotating.value) handleClick(e)
  dragging.value = false; rotating.value = false
  (e.target as HTMLElement).releasePointerCapture(e.pointerId)
}
async function handleClick(e: PointerEvent) {
  if (!canvas.value) return
  const r = canvas.value.getBoundingClientRect()
  mouse.x = ((e.clientX-r.left)/r.width)*2-1
  mouse.y = -((e.clientY-r.top)/r.height)*2+1
  raycaster.setFromCamera(mouse, camera)
  const hit = raycaster.intersectObjects(scene.children,true).find(h=>h.object.userData?.id)
  if (!hit) return
  const star = stars.value.find(s=>s._id===hit.object.userData.id)
  if (!star) return
  if (activeStar.value&&activeStar.value._id===star._id) {
    try {
      const { data } = await api.get(`/stars/${star._id}/three-d-rooms`)
      if (Array.isArray(data)&&data.length) {
        router.push({ name:'Room', params:{ starId:star._id } })
      } else throw new Error()
    } catch {
      noAccessMsg.value = 'No access to 3D room.'
      clearTimeout(msgTimer)
      msgTimer = setTimeout(()=> noAccessMsg.value='',10000)
    }
    return
  }
  focusStar(star)
}

// WASD fallback
const mv = { f:0,b:0,l:0,r:0 }
function onKey(e: KeyboardEvent) {
  if (!canControl()) return
  const v = e.type==='keydown'?1:0
  switch(e.key.toLowerCase()) {
    case 'w': case 'arrowup':    mv.f=v; break
    case 's': case 'arrowdown':  mv.b=v; break
    case 'a': case 'arrowleft':  mv.l=v; break
    case 'd': case 'arrowright': mv.r=v; break
  }
}
window.addEventListener('keydown', onKey)
window.addEventListener('keyup', onKey)
requestAnimationFrame(function step(){
  const fwd   = new THREE.Vector3(0,0,-1).applyEuler(camera.rotation)
  const right = new THREE.Vector3(1,0, 0).applyEuler(camera.rotation)
  if (canControl()) {
    camPos.value.addScaledVector(fwd,   (mv.f-mv.b)*0.05)
    camPos.value.addScaledVector(right, (mv.r-mv.l)*0.05)
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
  .topbar { position: fixed; top:24px; left:20px; display:flex; gap:8px; z-index:30; }
.compact-input{ width:160px; padding:6px 10px; border-radius:20px; border:none; }
.sky-canvas{ position: fixed; inset:0; display:block; cursor: grab; touch-action: none; }
  </style>