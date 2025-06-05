<!-- src/views/Sky.vue -->
<template>
    <!-- ══════ HEADER / SEARCH ───────────────────────────────────────── -->
    <header class="topbar">
      <!-- kleine zoekinput + suggesties wanneer paneel dicht -->
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
  
    <!-- ══════ SLIDE-IN PANEL ────────────────────────────────────────── -->
    <Transition name="slide">
      <aside v-if="panelOpen" class="panel">
        <div class="search-holder">
          <div class="field">
            <input
              v-model="searchTerm"
              class="compact-input"
              type="text"
              placeholder="Star name…"
              @keydown.stop
            />
            <ul v-if="suggestions.length" class="suggest">
              <li
                v-for="s in suggestions"
                :key="s._id"
                @click="focusStar(s)"
              >
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
          <span>
            Turn this on to hide all unknown public stars and show only those from your family and friends in the starry sky.
          </span>
        </div>
  
        <!-- Date of birth -->
        <label class="label">Date of birth
          <input v-model="dob" type="date" class="full-input" />
        </label>
  
        <!-- Date of death -->
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
  
    <!-- ══════ CANVAS ────────────────────────────────────────────────── -->
    <canvas
      ref="canvas"
      class="sky-canvas"
      @pointerdown="startLook"
      @pointermove="lookAround"
      @pointerup="stopLook"
      @pointerleave="stopLook"
    />
  
    <!-- Meldingen -->
    <div v-if="errorMsg" class="err">
      {{ errorMsg }} – <button @click="reload">retry</button>
    </div>
    <div v-else-if="loading" class="spinner">Loading…</div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import * as THREE from 'three'
  import { initScene }        from '../components/three/initScene'
  import { useStarsManager }  from '../components/three/StarsManager'
  import { useStars }         from '../composables/useStars'
  
  /* router voor later */
  const router = useRouter()
  
  /* ─── UI-state ─────────────────────────────────────────── */
  const panelOpen = ref(false)
  const searchTerm = ref('')
  const onlyMine = ref(false)
  const dob = ref('')
  const dod = ref('')
  const country = ref('')
  const coord = ref('')
  
  function togglePanel() { panelOpen.value = !panelOpen.value }
  
  /* ─── Data ─────────────────────────────────────────────── */
  const { stars, loading, errorMsg, reload } = useStars()
  const near = (v:number,t:number,m=2)=>Math.abs(v-t)<=m
  
  const filteredStars = computed(() => {
    let arr = [...stars.value]
    if (onlyMine.value) arr = arr.filter(s => s.related)
    if (dob.value) arr = arr.filter(s => s.user?.dob?.slice(0,10) === dob.value)
    if (dod.value) arr = arr.filter(s => s.user?.dod?.slice(0,10) === dod.value)
    if (country.value) arr = arr.filter(s => s.user?.country === country.value)
    if (coord.value) {
      const [x,y,z] = coord.value.split(',').map(Number)
      if (!isNaN(x)) arr = arr.filter(s => near(s.x,x))
      if (!isNaN(y)) arr = arr.filter(s => near(s.y,y))
      if (!isNaN(z)) arr = arr.filter(s => near(s.z,z))
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
  
  /* ─── Three & camera ───────────────────────────────────── */
  const camPos = ref(new THREE.Vector3(0,0,10))
  const camRot = ref({x:0,y:0})
  const FOCUS  = 20
  
  const canvas = ref<HTMLCanvasElement>()
  let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, composer: any
  
  onMounted(() => {
    if (!canvas.value) return
    ;({ renderer, scene, camera, composer } = initScene(canvas.value))
  
    /* achtergrondpuntjes */
    const pts = new Float32Array(1000*3).map(()=> (Math.random()-0.5)*2000)
    scene.add(new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(pts,3)),
      new THREE.PointsMaterial({color:0xffffff,size:1.5,opacity:0.8})
    ))
  
    /* sterren plaatsen */
    let detach:(()=>void)|undefined
    watch(()=>filteredStars.value, s => { detach?.(); detach = useStarsManager(scene,s,[]) },{immediate:true})
  
    renderer.setAnimationLoop(()=>{ camera.position.copy(camPos.value); camera.rotation.set(camRot.value.x,camRot.value.y,0); composer.render() })
    onUnmounted(()=>{ renderer.setAnimationLoop(null); detach?.() })
  })
  
  /* ─── Klik op ster ─────────────────────────────────────── */
  function focusStar(star:any){
    console.log('[Sky] clicked star', star)   // ← log detail
  
    const target = new THREE.Vector3(star.x,star.y,star.z)
    camera.lookAt(target)
    const dir = new THREE.Vector3().subVectors(camera.position,target).normalize()
    camPos.value.copy(target.clone().add(dir.multiplyScalar(FOCUS)))
  
    // TODO: wanneer 3D-room klaar is → navigeer
    // router.push({ name: 'Room', params: { starId: star._id } })
  
    panelOpen.value = false
    searchTerm.value = ''
  }
  
  /* ─── Controls (slechts aangepast voor disable) ─────────── */
  const inputActive = () => !!document.activeElement?.closest('input,select')
  const canControl  = () => !panelOpen.value && !inputActive()
  
  /* drag-look */
  const dragging = ref(false); let px=0,py=0
  function startLook(e:PointerEvent){ if(!canControl())return; dragging.value=true; px=e.clientX; py=e.clientY; (e.target as HTMLElement).setPointerCapture(e.pointerId) }
  function lookAround(e:PointerEvent){
    if(!dragging.value||!canControl())return
    const sp=.002, dx=e.clientX-px, dy=e.clientY-py; px=e.clientX; py=e.clientY
    camRot.value.y -= dx*sp
    camRot.value.x = Math.max(-Math.PI/2+.05, Math.min(Math.PI/2-.05, camRot.value.x - dy*sp))
  }
  function stopLook(e:PointerEvent){ dragging.value=false; (e.target as HTMLElement).releasePointerCapture(e.pointerId) }
  
  /* keyboard move */
  const mv={f:0,b:0,l:0,r:0}, SPEED=.6
  function onKey(e:KeyboardEvent){ if(!canControl())return
    const v=e.type==='keydown'?1:0
    switch(e.key.toLowerCase()){
      case'w':case'arrowup':mv.f=v;break
      case's':case'arrowdown':mv.b=v;break
      case'a':case'arrowleft':mv.l=v;break
      case'd':case'arrowright':mv.r=v;break
    }
  }
  window.addEventListener('keydown',onKey)
  window.addEventListener('keyup',onKey)
  requestAnimationFrame(function step(){
    const fwd=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(camRot.value.x,camRot.value.y))
    const right=new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(camRot.value.x,camRot.value.y))
    if(canControl()){
      camPos.value.addScaledVector(fwd,(mv.f-mv.b)*SPEED)
      camPos.value.addScaledVector(right,(mv.r-mv.l)*SPEED)
    }
    requestAnimationFrame(step)
  })
  </script>
  
  <style scoped>
  /* topbar */
  .topbar{position:fixed;top:24px;left:20px;display:flex;gap:8px;z-index:30}
  .compact-input{width:160px;padding:6px 10px;border-radius:20px;border:none;outline:none;background:#fff}
  
  /* panel */
  .slide-enter-from{transform:translateX(-100%)} .slide-enter-active,.slide-leave-active{transition:transform .3s ease} .slide-leave-to{transform:translateX(-100%)}
  .panel{position:fixed;top:0;left:0;width:300px;height:100vh;padding:24px 20px 32px;background:#0c1027;color:#fff;z-index:25;overflow-y:auto;
    box-shadow:0 0 20px rgba(0,0,0,.4);border-top-right-radius:16px;border-bottom-right-radius:16px}
  .search-holder{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .field{position:relative}
  .suggest{position:absolute;top:42px;left:0;right:0;background:#1a1f3d;border-radius:6px;max-height:160px;overflow-y:auto;padding:4px 0}
  .suggest li{padding:6px 12px;cursor:pointer;font-size:14px} .suggest li:hover{background:#252b52}
  .full-input,select{width:auto;padding:10px 12px;margin:12px 0;border-radius:6px;border:none;outline:none}
  .horizontalRow{display:flex;flex-direction:column;gap:8px;margin:12px 0}
  .switchRow{display:flex;justify-content:space-between;align-items:center;margin:12px 0}
  .switch{position:relative;width:40px;height:20px} .switch input{display:none}
  .slider{position:absolute;inset:0;background:#555;border-radius:10px;cursor:pointer;transition:.25s} .slider::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:2px;left:2px;transition:.25s}
  .switch input:checked + .slider{background:#fedf7e} .switch input:checked + .slider::after{transform:translateX(20px)}
  .label{display:flex;flex-direction:column;font-size:14px;margin:12px 0 0}
  .filterBtn{width:100%;padding:10px 0;margin-top:8px;border:none;border-radius:6px;background:#fedf7e;color:#111;font-weight:600;cursor:pointer}
  
  /* canvas & HUD */
  .sky-canvas{position:fixed;inset:0;display:block;cursor:grab;touch-action:none}
  .err{position:fixed;top:20px;left:20px;color:#e33;background:rgba(0,0,0,.65);padding:6px 10px;border-radius:4px;z-index:40}
  .spinner{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-family:sans-serif}
  </style>