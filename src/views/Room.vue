<!-- src/views/Room.vue -->
<template>
    <div class="wrap">
      <!-- ← Back -->
      <button class="back" @click="goBack">←</button>
  
      <!-- tab-iconen -->
      <div class="tabs">
        <button
          v-for="v in views"
          :key="v.key"
          :disabled="!hasContent[v.key]"
          :class="[{ active: active === v.key, disabled: !hasContent[v.key] }]"
          @click="toggleTab(v)"
        >
        <img :src="v.img" :alt="v.key" class="tab-icon" />
        </button>
      </div>
  
      <!-- 3-D room -->
      <PublicBasicRoomGL
        :initialCameraPosition="camPos"
        :initialCameraTarget="camTarget"
      />
  
      <!-- overlay -------------------------------------------------------- -->
      <transition name="fade">
        <div v-if="active" class="overlay">
          <!-- Foto’s -->
          <template v-if="active === 'Fotos'">
            <Viewer v-if="photos?.length" :items="photos" type="photo" v-model:index="photoIdx"/>
            <p v-else class="info">No photos available.</p>
          </template>
  
          <!-- Video’s -->
          <template v-else-if="active === 'Videos'">
            <Viewer v-if="videos?.length" :items="videos" type="video" v-model:index="videoIdx"/>
            <p v-else class="info">No videos available.</p>
          </template>
  
          <!-- Audio -->
          <template v-else-if="active === 'Audio'">
            <Viewer v-if="audios?.length" :items="audios" type="audio" v-model:index="audioIdx"/>
            <p v-else class="info">No audio files available.</p>
          </template>
  
          <!-- Documenten -->
          <template v-else-if="active === 'Documenten'">
            <div v-if="docs?.length" class="docBox">
              <h3>{{ docs[docIdx].originalName }}</h3>
              <div class="nav">
                <button @click="docIdx--" :disabled="docIdx === 0"><img src="../assets/icons/arrowLeft.svg" alt="back button"></button>
                <button class="open" @click="openDoc(docs[docIdx].url)">Open PDF</button>
                <button @click="docIdx++" :disabled="docIdx === docs.length - 1"><img src="../assets/icons/arrowRight.svg" alt="next button"></button>
              </div>
            </div>
            <p v-else class="info">No documents available.</p>
          </template>
  
          <!-- Messages -->
          <template v-else>
            <Viewer v-if="messages?.length" :items="messages" type="text" v-model:index="msgIdx"/>
            <p v-else class="info">No messages available.</p>
          </template>
  
          <button class="close" @click="closeOverlay">×</button>
        </div>
      </transition>
  
      <!-- load-states -->
      <div v-if="loading"                class="center">Loading…</div>
      <div v-else-if="error"             class="center err">{{ error }}</div>
      <div v-else-if="rooms.length === 0" class="center">No basic room available.</div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import api from '../lib/axios'
  import PublicBasicRoomGL from '../components/rooms/PublicBasicRoomGL.vue'
  import fotosIcon      from '../assets/icons/public-photo.svg'
    import videosIcon     from '../assets/icons/public-video.svg'
    import audioIcon      from '../assets/icons/public-audio.svg'
    import documentenIcon from '../assets/icons/public-documents.svg'
    import messagesIcon   from '../assets/icons/public-message.svg'
    import Viewer from '../components/Viewer.vue'

  
  console.log('[Room.vue] script setup has started');
  type ViewKey = 'Fotos' | 'Videos' | 'Audio' | 'Documenten' | 'Messages'
  type ThreeDRoom = { _id: string }
  type MediaItem  = { _id: string; url: string }
  type DocumentItem = { _id: string; originalName: string; url: string }
  type Message    = { _id: string; message: string }
  
  const router = useRouter()
  const starId = useRoute().params.starId as string
  console.log('[Room] starId =', starId)
  
  /* ─── camera --------------------------------------------------------- */
  const initialPos    = [0, 16, 20] as [number,number,number]
  const initialTarget = [0, 3,  0]  as [number,number,number]
  const camPos    = ref(initialPos)
  const camTarget = ref(initialTarget)
  
  /* ─── fetch eerste room --------------------------------------------- */
  const rooms   = ref<ThreeDRoom[]>([])
  const loading = ref(false)
  const error   = ref<string|null>(null)
  
  onMounted(async () => {
    try {
      loading.value = true
      const { data } = await api.get(`/stars/${starId}/three-d-rooms`)
  
      /* ------------ DEBUG LOGS ------------ */
      console.log('[Room] axios raw   ->', data)       // ① ruwe response
      rooms.value = Array.isArray(data) ? data.slice(0, 1) : []
      console.log('[Room] rooms.value ->', rooms.value) // ② reactieve array
      console.log('[Room] length      ->', rooms.value.length) // ③ length
      /* ------------------------------------- */
  
    } catch (e) {
      console.error('[Room] fetch-error', e)
      error.value = 'Failed to load 3-D rooms'
    } finally {
      loading.value = false
    }
  })
  
  /* ─── tab-definitie -------------------------------------------------- */
  const views = [
  { key: 'Fotos',      img: fotosIcon,     pos:[12, 9, -2], target: [1000, -9, -2]  },
  { key: 'Videos',     img: videosIcon,    pos:[14, 10, -2], target: [1000, -1000, -2]  },
  { key: 'Audio',      img: audioIcon,     pos:[10, 10, 7], target: [1000, -1000, 7]  },
  { key: 'Documenten', img: documentenIcon,pos: [7, 5, -2], target: [9, 1, -4.5] },
  { key: 'Messages',   img: messagesIcon,  pos: [1.5, 10, 0], target: [1.5, -1000, 0]  },
] as const
  
  const active = ref<ViewKey | ''>('')
  
  const hasContent = reactive<Record<ViewKey, boolean>>({
    Fotos:false, Videos:false, Audio:false, Documenten:false, Messages:false
  })
  
  /* ─── availability ping --------------------------------------------- */
  watch(rooms, async r => {
    if (!r.length) return
    const roomId = r[0]._id
    const base   = `/stars/${starId}/three-d-rooms/${roomId}`
    try {
      const [ph,v,a,d,m] = await Promise.all([
        api.get(base + '/photos?limit=1'),
        api.get(base + '/videos?limit=1'),
        api.get(base + '/audios?limit=1'),
        api.get(base + '/documents?limit=1'),
        api.get(base + '/messages?limit=1'),
      ])
      hasContent.Fotos      = ph.data.length > 0
      hasContent.Videos     = v.data.length > 0
      hasContent.Audio      = a.data.length > 0
      hasContent.Documenten = d.data.length > 0
      hasContent.Messages   = m.data.length > 0
    } catch {/* network errors -> negeren */}
  })
  
  /* ─── overlay data -------------------------------------------------- */
  const photos   = ref<MediaItem[]   | null>(null)
  const videos   = ref<MediaItem[]   | null>(null)
  const audios   = ref<MediaItem[]   | null>(null)
  const docs     = ref<DocumentItem[]| null>(null)
  const messages = ref<Message[]     | null>(null)
  
  const photoIdx = ref(0)
  const videoIdx = ref(0)
  const audioIdx = ref(0)
  const docIdx   = ref(0)
  const msgIdx   = ref(0)
  
  watch(active, async tab => {
    photos.value = videos.value = audios.value = docs.value = messages.value = null
    if (!tab || !rooms.value.length) return
    const roomId = rooms.value[0]._id
    const base   = `/stars/${starId}/three-d-rooms/${roomId}`
    try {
      if (tab === 'Fotos')      photos.value   = (await api.get(base + '/photos'   )).data
      if (tab === 'Videos')     videos.value   = (await api.get(base + '/videos'   )).data
      if (tab === 'Audio')      audios.value   = (await api.get(base + '/audios'   )).data
      if (tab === 'Documenten') docs.value     = (await api.get(base + '/documents')).data
      if (tab === 'Messages')   messages.value = (await api.get(base + '/messages' )).data
    } catch {/* laat leeg bij fout */}
  })
  
  /* ─── UI-helpers ---------------------------------------------------- */
  function toggleTab(v: any) {
    if (active.value === v.key) { closeOverlay(); return }
    active.value  = v.key as ViewKey
    camPos.value  = v.pos
    camTarget.value = v.target
  }
  function closeOverlay () {
    active.value    = ''
    camPos.value    = initialPos
    camTarget.value = initialTarget
  }
  function openDoc (url:string) { window.open(url, '_blank') }
  
  /* ─── back-navigatie ------------------------------------------------- */
  function goBack () {
    if (window.history.state && window.history.length > 1) return router.back()
    router.push({ name:'Sky' })
  }
  </script>
  
  <style scoped>
  .wrap{position:relative;height:100vh;background:#fff;color:#fff}
  .back{position:absolute;top:20px;left:20px;background:none;border:none;color:#000;font-size:28px;z-index:20}
  .tabs{position:absolute;bottom:20px;left:20px;background:#000;padding:16px 8px; border-radius: 70px;
        display:flex;flex-direction:column;gap:24px;z-index:20}
  .tabs button{border:none;border-radius: 100px; background:#000;color:#fff;}
  .tabs button.disabled{opacity:.35;pointer-events:none}
  
  .fade-enter-active,.fade-leave-active{transition:opacity .25s}
  .fade-enter-from,.fade-leave-to{opacity:0}
  
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);padding:20px;display:flex;flex-direction:column;z-index:15}
  .close{position:absolute;top:40px;right:40px;font-size:36px;background:none;border:none;color:#fff}
  .info{font-size:20px;text-align:center;margin:auto}
  .err{color:#e55;font-size:20px;text-align:center;margin:auto}
  .center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  
  .viewer{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .media{max-width:100%;max-height:70vh;margin-bottom:16px}
  .txt{font-size:20px;margin:0 24px;white-space:pre-wrap;text-align:center}
  .nav{display:flex;justify-content:space-between;width:100%}
  .nav button{background:none;border:none;color:#fff;font-size:34px;flex:1}
  .nav button:disabled{opacity:.3}
  
  .docBox{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .docBox h3{margin-bottom:16px;text-align:center}
  .open{background:#444;color:#fff;border:none;border-radius:4px;padding:12px 22px;margin:0 12px}
  </style>