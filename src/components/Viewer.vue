<template>
    <div class="viewer">
      <img   v-if="type === 'photo'" :src="items[index].url" class="media" />
      <video v-else-if="type === 'video'" :src="items[index].url" controls class="media"></video>
      <audio v-else-if="type === 'audio'" :src="items[index].url" controls style="width:100%"></audio>
      <p     v-else class="txt">{{ items[index].message }}</p>
  
      <div class="nav">
        <button @click="$emit('update:index', Math.max(index - 1, 0))" :disabled="index === 0"><img src="../assets/icons/arrowLeft.svg" alt="go back"></button>
        <button @click="$emit('update:index', Math.min(index + 1, items.length - 1))"
                :disabled="index === items.length - 1"><img src="../assets/icons/arrowRight.svg" alt=""></button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { PropType } from 'vue'
  
  defineProps<{
    items: any[]
    index: number
    type: 'photo' | 'video' | 'audio' | 'text'
  }>()
  
  defineEmits<{
    (e: 'update:index', value: number): void
  }>()
  </script>
  
  <style scoped>
  .viewer { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80%;padding-left: 160px; }
  .media  { max-width: 100%; max-height: 70vh; margin-bottom: 16px }
  .txt    { font-size: 20px; margin: 0 24px; white-space: pre-wrap; text-align: center }
  .nav    { display: flex; justify-content: space-between; width: 100% }
  .nav button { background: none; border: none; color: #fff; font-size: 34px; flex: 1 }
  .nav button:disabled { opacity: .3 }
  </style>