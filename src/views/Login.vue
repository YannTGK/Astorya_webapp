<!-- src/views/Login.vue -->
<template>
  <div class="screen">
    <!-- Linkerhelft -->
    <div class="leftHolder">
      <!-- 1) Logo bovenaan -->
      <img src="../assets/Logo.svg" alt="Astorya Logo" />

      <!-- 2) Titel -->
      <h1 class="pageTitle">
        WelcOme back! 
        lOg in.
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

      <div class="socialButtons">
        <img src="../assets/itsme.svg" alt="ItsMe" />
        <img src="../assets/google.svg" alt="Google" />
        <img src="../assets/facebook.svg" alt="Facebook" />
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
@import url('https://fonts.googleapis.com/css2?family=Alice&display=swap');

@font-face {
  font-family: 'SUNROLL';
  src: url('@/fonts/SUNROLL.TTF') format('truetype');
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Alice', serif;
  font-size: 0.9rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.leftHolder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 3vh 4vw;
  background-color: #fff;
  width: 100%;
}

.leftHolder img {
  max-width: 80px;
  height: auto;
  margin-top: 1vh;
}

.pageTitle {
  font-family: 'SUNROLL', serif;
  font-size: clamp(1.2rem, 2vw, 1.8rem);
  color: #11152A;
  text-align: left;
  margin: 3vh auto 2vh;
  line-height: 1.3;
  width: 100%;
  max-width: 360px;
}

.loginForm {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
}

.field input {
  padding: 0.55rem 0.8rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  outline: none;
  font-family: 'Alice', serif;
}

.passwordWrapper {
  position: relative;
}

.passwordWrapper input {
  width: 100%;
  padding-right: 32px;
}

.toggleIcon {
  position: absolute;
  right: 10px;
  top: 36%;
  width: 18px;
  height: 18px;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.7;
}

.toggleIcon:hover {
  opacity: 1;
}

.forgotLink {
  font-size: 0.7rem;
  text-align: right;
  text-decoration: none;
  color: #555;
  margin-top: 3px;
}

.loginBtn {
  display: block;
  width: 100%;
  background-color: #feedb6;
  color: #11152a;
  text-align: center;
  padding: 0.8rem 0;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-family: 'Alice', serif;
}

.loginBtn:hover {
  background-color: #fddf84;
}

.loginBtn.disabled {
  pointer-events: none;
  opacity: 0.6;
}

.separator {
  width: 100%;
  max-width: 360px;
  text-align: center;
  margin: 1.5rem 0 1.2rem;
  position: relative;
  font-size: 0.75rem;
  color: #777;
}

.separator::before,
.separator::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
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
  background-color: #fff;
  padding: 0 0.8rem;
  font-size: 0.75rem;
}

.socialButtons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.socialButtons img {
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.socialButtons img:hover {
  transform: scale(1.05);
}

.footerText {
  font-size: 0.75rem;
  color: #555;
  margin-bottom: 1.5vh;
  text-align: center;
}

.error {
  color: #e33;
  font-size: 0.75rem;
  text-align: center;
  margin-top: -0.4rem;
}

.rightHolder {
  display: none;
}

@media only screen and (min-width: 1024px) {
  .screen {
    flex-direction: row;
  }

  .leftHolder {
    width: 50%;
    height: 100vh;
    justify-content: center;
    padding: 4vh 5vw;
  }

  .rightHolder {
    display: flex;
    width: 50%;
    height: 100vh;
    background: linear-gradient(180deg, #11152A 0%, #273166 50%, #11152A 100%);
    align-items: flex-end;
    justify-content: flex-start;
    padding: 32px;
    background-image: url('../assets/vailStars.svg');
    background-size: cover;
    background-position: center;
  }

  .rightHolder h2 {
    color: #ffffff;
    font-family: 'SUNROLL', serif;
    font-size: clamp(1.8rem, 2vw, 2.5rem);
    line-height: 1.3;
  }
}
</style>