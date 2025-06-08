<template>
<header class="topbar">
  <div class="field searchbar" v-if="!panelOpen">
    <img src="@/assets/icons/search.svg" class="search-icon" />
    <input
      v-model="searchTerm"
      class="compact-input"
      type="text"
      placeholder="Search"
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
            class="compact-input starname-input"
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
       <button class="icon-btn close-btn" @click="togglePanel">
        <img src="@/assets/icons/close.svg" alt="Close" />
      </button>
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
  <input v-model="dob" type="date" class="full-input" placeholder="DD/MM/JJJJ" />
</label>

<label class="label">Date of death
  <input v-model="dod" type="date" class="full-input" placeholder="DD/MM/JJJJ" />
</label>

<label class="label">Country
  <select v-model="country" class="full-input">
    <option value="">Belgium</option>
    <option>Netherlands</option>
  </select>
</label>

<label class="label">Coördinate
  <input v-model="coord" class="full-input" placeholder="X0,Y0,Z0" />
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
    @pointerup="stopLook"
     @pointercancel="stopLook"
  />

  <!-- OVERLAYS -->
  <Transition name="fade">
    <div v-if="focusedName" class="star-label">{{ focusedName }}</div>
  </Transition>
  <Transition name="fade">
    <div v-if="noAccessMsg" class="access-label">{{ noAccessMsg }}</div>
  </Transition>
  <button class="logout-btn" @click="logout">Logout</button>
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
import { initScene } from '../components/three/initScene'
import { useStarsManager } from '../components/three/StarsManager'
import { useStars } from '../composables/useStars'
import api from '../lib/axios'
import { router } from '../router'
import type { StarData } from '../types'
import { useAuthStore } from '../stores/auth'

// UI state & filters
const panelOpen  = ref(false)
const searchTerm = ref('')
const onlyMine   = ref(false)
const dob        = ref('')
const dod        = ref('')
const country    = ref('')
const coord      = ref('')
const togglePanel = () => (panelOpen.value = !panelOpen.value)
const auth = useAuthStore()

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
const SPEED = 10 // thumbstick speed

const canvas = ref<HTMLCanvasElement>()
let renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    composer: any,
    starMgr: ReturnType<typeof useStarsManager>

const raycaster = new THREE.Raycaster()
const mouse     = new THREE.Vector2()


// Logout handler
function logout() {
  // dit wist je token + user uit Pinia en localStorage
  auth.logout()
  // en stuur je terug naar de login-screen
  router.push({ name: 'Login' })
}

onMounted(() => {
  if (!canvas.value) return;

  // 1) Init scene + composer
  ;({ renderer, scene, camera, composer } = initScene(canvas.value));
  document.body.appendChild(VRButton.createButton(renderer));

  // ======= GALAXY GRADIENT ACHTERGROND =======
const galaxyGeo = new THREE.SphereGeometry(2500, 64, 64);
const galaxyMat = new THREE.ShaderMaterial({
  uniforms: {
    colorCenter: { value: new THREE.Color('#101427') }, // diep blauw
    colorEdge:   { value: new THREE.Color('#000000') }, // zwart
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorCenter;
    uniform vec3 colorEdge;
    varying vec2 vUv;
    void main() {
      float distToCenter = distance(vUv, vec2(0.5, 0.5));
      float verticalBlend = smoothstep(0.2, 0.8, vUv.y);
      float radial = smoothstep(0.0, 0.8, distToCenter);
      float blend = mix(verticalBlend, radial, 0.6);
      vec3 color = mix(colorCenter, colorEdge, blend);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.BackSide, // <--- BELANGRIJK: binnenkant van de bol tonen!
  depthWrite: false,
});
const galaxySphere = new THREE.Mesh(galaxyGeo, galaxyMat);
scene.add(galaxySphere);

  // 2) “World” group
  const world = new THREE.Group();
  scene.add(world);

  // 3) Controllers + laser + spotlight
  const ctrlFactory = new XRControllerModelFactory();
  for (let i = 0; i < 2; i++) {
    const ctrl = renderer.xr.getController(i);
    scene.add(ctrl);
    const grip = renderer.xr.getControllerGrip(i);
    grip.add(ctrlFactory.createControllerModel(grip));
    scene.add(grip);

    // Laser line
    const laser = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    laser.scale.set(1, 1, 10);
    ctrl.add(laser);

    // Spotlight
    const spot = new THREE.SpotLight(0xffffff, 1, 15, Math.PI * 0.1, 0.5);
    spot.position.set(0, 0, 0);
    spot.target.position.set(0, 0, -1);
    ctrl.add(spot);
    ctrl.add(spot.target);
  }

  // 4) Achtergrond-sterren als instanced spheres met eigen fases
  const starCount = 1000;
  const baseRadius = 0.5;

  // a) Geometry & materiaal
  const starGeo = new THREE.SphereGeometry(1, 8, 8);
  const starMat = new THREE.MeshStandardMaterial({
    color:             0xffffff,
    emissive:          0xffffff,
    emissiveIntensity: 1,
    roughness:         1,
    metalness:         0,
  });
  const starsInst = new THREE.InstancedMesh(starGeo, starMat, starCount);

  // b) Arrays om posities en fases in op te slaan
  const positions = new Float32Array(starCount * 3);
  const phases    = new Float32Array(starCount);

  // c) Dummy-object voor matrix-updates
  const dummy = new THREE.Object3D();
  for (let i = 0; i < starCount; i++) {
    // random positie
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    positions[3 * i]     = x;
    positions[3 * i + 1] = y;
    positions[3 * i + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;

    // init matrix met basis-scale
    dummy.position.set(x, y, z);
    dummy.scale.set(baseRadius, baseRadius, baseRadius);
    dummy.updateMatrix();
    starsInst.setMatrixAt(i, dummy.matrix);
  }
  world.add(starsInst);

  // d) Clock voor animatie
  const clock = new THREE.Clock();

  // 5) Je sterren vanuit useStarsManager
  starMgr = useStarsManager(world, []);
  watch(filteredStars, s => starMgr.update(s), { immediate: true });

  // 6) Render-loop met individuele pulsatie & movement
  const ROTATE_SPEED = 0.03;
  renderer.setAnimationLoop(() => {
    // camera / movement
    camera.position.copy(camPos.value);
    camera.rotation.set(camRot.value.x, camRot.value.y, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const right   = new THREE.Vector3(1, 0,  0).applyEuler(camera.rotation);

    let dz = 0, dx = 0, turn = 0;
    const session = renderer.xr.getSession();
    if (session) {
      for (const src of session.inputSources) {
        if (!src.gamepad) continue;
        const axes = src.gamepad.axes;
        const x = axes.length >= 4 ? axes[2] : axes[0];
        const y = axes.length >= 4 ? axes[3] : axes[1];
        if (src.handedness === 'left') {
          if (Math.abs(y) > 0.2) dz = -y * SPEED;
          if (Math.abs(x) > 0.2) dx = -x * SPEED;
        } else {
          if (Math.abs(x) > 0.2) turn = x * ROTATE_SPEED;
        }
      }
    } else {
      const gp = navigator.getGamepads?.()[0];
      if (gp) {
        const axes = gp.axes;
        const x = axes.length >= 4 ? axes[2] : axes[0];
        const y = axes.length >= 4 ? axes[3] : axes[1];
        if (Math.abs(y) > 0.2) dz = -y * SPEED;
        if (Math.abs(x) > 0.2) dx = -x * SPEED;
        if (Math.abs(axes[0]) > 0.2) turn = axes[0] * ROTATE_SPEED;
      }
    }

    // toepassen beweging
    if (renderer.xr.isPresenting) {
      world.position.addScaledVector(forward, dz);
      world.position.addScaledVector(right,   dx);
      world.rotation.y -= turn;
    } else {
      camPos.value.addScaledVector(forward, dz);
      camPos.value.addScaledVector(right,   dx);
      camRot.value.y -= turn;
    }

    // Puls-animatie per ster
    const t = clock.getElapsedTime();
    for (let i = 0; i < starCount; i++) {
      const s = baseRadius * (1 + 0.3 * Math.sin(t * 2 + phases[i]));
      dummy.position.set(
        positions[3*i],
        positions[3*i+1],
        positions[3*i+2]
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      starsInst.setMatrixAt(i, dummy.matrix);
    }
    starsInst.instanceMatrix.needsUpdate = true;

    // render
    if (renderer.xr.isPresenting) {
      renderer.render(scene, camera);
    } else {
      composer.render();
    }
  });
});

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
  if (!canControl() || e.button !== 0) return

  dragging.value = true
  rotating.value = false

  startX = px = e.clientY
  startX = px = e.clientX
  startY = py = e.clientY
  startY = py = e.clientY

;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}


function lookAround(e: PointerEvent) {
  // guard: alleen als we slepen én juiste event
  if (!dragging.value || !canControl() || typeof e.clientX !== 'number') return

  // als muisknop losgelaten, beëindig
  if ((e.buttons & 1) === 0) {
    stopLook(e)
    return
  }

  const dx = e.clientX - px
  const dy = e.clientY - py
  px = e.clientX
  py = e.clientY

  if (!rotating.value && Math.hypot(e.clientX - startX, e.clientY - startY) > THRESH) {
    rotating.value = true
  }
  if (rotating.value) {
    const sp = 0.002
    camRot.value.y -= dx * sp
    camRot.value.x = Math.max(-Math.PI/2+0.05,
      Math.min(Math.PI/2-0.05, camRot.value.x - dy*sp))
  }
}

function stopLook(e: PointerEvent) {
  // guard: event moet bestaan en pointerId geldig
  if (!e || typeof e.pointerId !== 'number') return

  // alleen ontgrendelen als we aan het slepen waren
  if (dragging.value && canControl()) {
    if (!rotating.value) handleClick(e)
    dragging.value = false
    rotating.value = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }
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
  const fwd    = new THREE.Vector3(0,0,-1).applyEuler(camera.rotation)
  const strafe = new THREE.Vector3(1,0, 0).applyEuler(camera.rotation)
  if (canControl()) {
    camPos.value.addScaledVector(fwd,    (mv.f - mv.b) * SPEED)
    camPos.value.addScaledVector(strafe, (mv.r - mv.l) * SPEED)
  }
  requestAnimationFrame(step)
})
</script>
  
<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Alice&display=swap');

  body {
    font-family: 'Alice', serif;
  }
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
    margin-top: -12px;
    margin-bottom: 8px;
  }
  .full-input,
  select {
    width: auto;
    padding: 10px 12px;
    margin: 8px 0;
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
    background: #FEEDB6;
    color: #111;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Alice', serif;
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
    /*background: #000a;*/
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
.logout-btn {
  position: absolute;
  right: 24px;
  top: 24px;
  margin-left: auto;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  background-color: #FEEDB6;
  color: #11152a;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-family: 'Alice', serif;
  font-size: 0.9rem;
}
.searchbar {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40px;
  padding: 2px 12px 2px 40px;
  box-shadow: 0 1px 8px rgba(16,20,39,0.06);
  width: 260px;
  height: 40px;
}
.search-icon {
  position: absolute;
  left: 18px;
  width: 22px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.7;
}
.compact-input {
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Alice', serif;
  font-size: 1rem;
  flex: 1;
  padding: 0 0 0 18px;
  color: #11152a;
}
.close-btn {
  background: none;
  border: none;
  box-shadow: none;
  position: absolute;
  top: 22px;
  right: 26px;
  padding: 0;
  cursor: pointer;
  z-index: 20;
}
.close-btn img {
  width: 34px;
  height: 34px;
  opacity: 0.85;
}
.panel .searchbar {
  height: 42px;
  width: 100%;
  padding: 4px 16px 4px 42px;
}
.panel .search-icon {
  width: 18px;
  left: 14px;
}
.starname-input {
  font-family: 'Alice', serif;
  font-size: 0.95rem;
  color: #fff;
  background: #1a1f3d;
  padding: 6px 12px 6px 14px;
  border-radius: 20px;
  width: 50%;
  border: none;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.05);
}

.starname-input::placeholder {
  color: #ccc;
  opacity: 0.7;
  font-style: italic;
}

</style>