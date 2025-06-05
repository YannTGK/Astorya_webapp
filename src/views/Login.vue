<!-- src/views/Login.vue -->
<template>
  <div class="screen">
    <!-- Linkerhelft -->
    <div class="leftHolder">
      <!-- 1) Logo bovenaan -->
      <img src="../assets/Logo.svg" alt="Astorya Logo" />

      <!-- 2) Titel -->
      <h1 class="pageTitle">
        Welcome back!<br />
        Log in.
      </h1>

      <!-- 3) Formulier -->
      <form ref="loginForm" @submit.prevent="onSubmit" class="loginForm">
        <!-- 3a) E-mail veld -->
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="mariaparker@gmail.com"
            required
          />
        </div>

        <!-- 3b) Wachtwoord veld met oog-icoon -->
        <div class="field passwordField">
          <label for="password">Password</label>
          <div class="passwordWrapper">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="••••••••••••••"
              required
            />
            <!-- Oog-icoon (toggle zichtbaarheid) -->
            <img
              src="../assets/see.svg"
              alt="Toggle visibility"
              class="toggleIcon"
              @click="toggleShowPassword"
            />
          </div>
          <!-- “Forgot password?” link -->
          <a href="#" class="forgotLink">Forgot password?</a>
        </div>

        <!-- 3c) Login-knop (gebruik <a> in plaats van <button>) -->
          <a
            href="#"
            class="loginBtn"
            :class="{ disabled: loading }"
            @click.prevent="submitViaAnchor"
          >
            <span v-if="!loading">Log in</span>
            <span v-else>Logging in…</span>
          </a>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>

      <!-- 4) “OR” separator -->
      <div class="separator">
        <span>OR</span>
      </div>

      <!-- 6) Footer-tekst -->
      <p class="footerText">
        Don’t have an account yet? Download the app
      </p>
    </div>

    <!-- Rechterhelft (zoals jouw originele “rightHolder”) -->
    <div class="rightHolder">
      <h2>Write your story in the stars<br />with Astorya</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loginForm = ref<HTMLFormElement>()

/* UI */
const loading  = ref(false)
const errorMsg = ref('')

function submitViaAnchor() {
  loginForm.value?.requestSubmit()
}

async function onSubmit() {
  if (loading.value) return               // dubbelklik voorkomen
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push({ name: 'Sky' })
  } catch (e: any) {
    errorMsg.value =
      e.response?.data?.message ?? 'Login failed, please try again.'
  } finally {
    loading.value = false
  }
}

function toggleShowPassword() {
  showPassword.value = !showPassword.value
}
</script>

<style scoped>
/* 1) Global reset binnen dit component */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 2) Hoofdcontainer */
.screen {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
}

/* 3) Linkerhelft (login) */
.leftHolder {
  width: 50%;
  padding: 64px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  gap: 32px;
  overflow-y: auto;
}

/* 3.1) Logo */
.logoImg {
  width: 140px;
  height: auto;
  margin-bottom: 16px;
}

/* 3.2) Pagina-titel */
.pageTitle {
  font-size: 32px;
  font-weight: 600;
  color: #11152a;
  text-align: center;
  line-height: 1.2;
}

/* 3.3) Formulier */
.loginForm {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 3.3a) Algemene styling voor inputvelden */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.field label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.field input {
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  color: #11152a;
  outline: none;
  transition: border-color 0.2s ease;
}

.field input:focus {
  border-color: #888;
}

/* 3.3b) Wachtwoord-veld met oog-icoon */
.passwordField .passwordWrapper {
  position: relative;
  width: 100%;
}

.passwordWrapper input {
  width: 100%;
  padding-right: 40px; /* ruimte voor oog-icoon */
}

.toggleIcon {
  position: absolute;
  right: 12px;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.toggleIcon:hover {
  opacity: 1;
}

/* “Forgot password?” link */
.forgotLink {
  font-size: 14px;
  color: #555;
  text-decoration: none;
  margin-top: 4px;
  align-self: flex-end;
  transition: color 0.2s ease;
}

.forgotLink:hover {
  color: #11152a;
}

/* 3.3c) Login-knop als <a> */
.loginBtn {
  display: block;
  width: 100%;
  background-color: #feedb6;
  color: #11152a;
  text-align: center;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.3s ease;
  cursor: pointer;
}

.loginBtn:hover {
  background-color: #fddf84;
}

/* 4) Separator “OR” */
.separator {
  width: 100%;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 8px;
  position: relative;
}

.separator::before,
.separator::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: #ccc;
}

.separator::before {
  left: 0;
}

.separator::after {
  right: 0;
}

.separator span {
  display: inline-block;
  padding: 0 12px;
  font-size: 14px;
  color: #777;
  background-color: #fff;
}

/* 5) Social login knoppen */
.socialButtons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.socialBtn img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.socialBtn img:hover {
  opacity: 0.8;
}

/* 6) Footertekst */
.footerText {
  font-size: 14px;
  color: #555;
  text-align: center;
  margin-top: 8px;
}

/* 7) Rechterhelft (jouw originele styling) */
.rightHolder {
  width: 50%;
  background-color: #11152a;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 40px 80px;
  background-image: url('../assets/vailStars.svg');
  background-size: cover;
  background-position: center;
}

.rightHolder h2 {
  color: #ffffff;
  font-size: 48px;
  font-weight: 300;
  line-height: 1.2;
  text-align: right;
}

.error {
  color: #e33;
  font-size: 14px;
  margin-top: -8px;
  text-align: center;
}

.loginBtn.disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>