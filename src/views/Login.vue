<template>
  <div class="screen">
    <!-- Linkerhelft -->
    <div class="leftHolder">
      <img src="../assets/Logo.svg" alt="Astorya Logo" />

      <h1 class="pageTitle">
        WelcOme back! 
        lOg in.
      </h1>

      <form ref="loginForm" @submit.prevent="onSubmit" class="loginForm">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="Elinelievens.com"
            required
          />
        </div>

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
            <img
              src="../assets/see.svg"
              alt="Toggle visibility"
              class="toggleIcon"
              @click="toggleShowPassword"
            />
          </div>
          <a href="#" class="forgotLink">Forgot password?</a>
        </div>

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

      <div class="separator">
        <span>OR</span>
      </div>

      <div class="socialButtons">
        <img src="../assets/itsme.svg" alt="ItsMe" />
        <img src="../assets/google.svg" alt="Google" />
        <img src="../assets/facebook.svg" alt="Facebook" />
      </div>

      <p class="footerText">
        Don’t have an account yet? Download the app
      </p>
    </div>

    <!-- Sterrenhemel rechts -->
    <section class="rightSection">
      <canvas ref="starsCanvas" id="starsCanvas"></canvas>
      <h1 class="starTitle">Write your StOry <br>in the Stars with AStOrya</h1>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loginForm = ref<HTMLFormElement>()
const starsCanvas = ref<HTMLCanvasElement | null>(null)

const loading  = ref(false)
const errorMsg = ref('')

function submitViaAnchor() {
  loginForm.value?.requestSubmit()
}

async function onSubmit() {
  if (loading.value) return
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

onMounted(() => {
  const canvas = starsCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let stars: any[] = []
  const numStars = 200

  const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    initStars()
  }

  const initStars = () => {
    stars = []
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
        direction: Math.random() > 0.5 ? 1 : -1
      })
    }
  }

  const drawStars = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach(star => {
      star.brightness += star.speed * star.direction
      if (star.brightness > 1) {
        star.brightness = 1
        star.direction = -1
      } else if (star.brightness < 0.3) {
        star.brightness = 0.3
        star.direction = 1
      }
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius * star.brightness, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${star.brightness})`
      ctx.fill()
    })
    requestAnimationFrame(drawStars)
  }

  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()
  drawStars()
})
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
  background-color: #FEEDB6;
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
  opacity: 0.9;
  cursor: pointer;
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

.starTitle {
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
    .rightSection {
    display: flex;
    width: 50%;
    height: 100vh;
    position: relative;
    background: linear-gradient(180deg, #11152A 0%, #273166 50%, #11152A 100%);
    align-items: flex-end;
    justify-content: flex-start;
    overflow: hidden;
  }

  #starsCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .starTitle {
    display: block;
    position: relative;
    font-family: 'SUNROLL', serif;
    font-size: clamp(2rem, 1.8vw, 2.6rem);
    color: #ffffff;
    text-align: left;
    z-index: 1;
    padding: 0 40px 40px 40px;
    line-height: 1.6;
    white-space: pre-line;
  }
}
</style>