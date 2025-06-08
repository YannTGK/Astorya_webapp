<!-- src/views/Home.vue -->
<template>
  <div class="screen">
    <!-- linkerkant: altijd zichtbaar -->
    <div class="leftHolder">
      <img src="../assets/Logo.svg" alt="Astorya Logo" class="logo-img" />
      <div class="pAndB">
        <h1 class="logo">Welcome to the VR-space!</h1>
        <p class="leftText">
          Our webapp offers an immersive VR experience directly through your browser.
          By entering the VR mode, you can explore the virtual environment in 360°,
          interact with stars, and experience the memories in a more engaging way.
          <br /><br />
          Don’t have a VR headset? You can still explore in 3D using the joystick.
        </p>
        <div class="buttons">
          <router-link to="/login" class="loginBtn">Log in</router-link>
          <router-link to="/guest" class="guestBtn">Continue as guest</router-link>
        </div>
      </div>
    </div>

    <!-- rechterkant: alleen desktop -->
    <section class="section rightSection">
      <!-- animated stars -->
      <canvas id="starsCanvas" ref="starsCanvas"></canvas>
      <!-- static overlay + gradient zit in CSS -->
      <h1 class="starTitle">Write your StOry in the Stars with AStOrya</h1>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home',
  mounted() {
    const canvas = this.$refs.starsCanvas;
    const ctx = canvas.getContext('2d');

    // resize + (re)initaliseren
    let stars = [];
    const numStars = 200;

    function initStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          brightness: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.02 + 0.005,
          direction: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // tekenloop
    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.brightness += star.speed * star.direction;
        if (star.brightness > 1) {
          star.brightness = 1;
          star.direction = -1;
        } else if (star.brightness < 0.3) {
          star.brightness = 0.3;
          star.direction = 1;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * star.brightness, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }
    drawStars();
  }
};
</script>

<style scoped>
/* 1) Fonts */
@import url('https://fonts.googleapis.com/css2?family=Alice&display=swap');
@font-face {
  font-family: 'SUNROLL';
  src: url('@/fonts/SUNROLL.TTF') format('truetype');
}

/* 2) Reset & base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 3) Mobile-first */
.screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}

.leftHolder {
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 32px;
}

.logo-img {
  max-width: 120px;
}

.pAndB {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 480px;
}

.logo {
  font-family: 'SUNROLL', serif;
  font-size: 1.75rem;
  color: #11152A;
  text-align: left;
}

.leftText {
  font-family: 'Alice', serif;
  font-size: 1rem;
  color: #11152A;
  opacity: 0.8;
  text-align: justify;
  line-height: 1.5;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.loginBtn,
.guestBtn {
  display: block;
  width: 100%;
  padding: 14px 0;
  border-radius: 6px;
  text-decoration: none;
  font-family: 'Alice', serif;
  font-weight: bold;
  text-align: center;
}

.loginBtn {
  background-color: #FEEDB6;
  color: #11152A;
}

.guestBtn {
  background-color: #11152A;
  color: #ffffff;
}

/* 4) Tablet */
@media only screen and (min-width: 778px) {
  .leftHolder {
    padding: 48px 64px;
  }
  .logo {
    font-size: 2.5rem;
  }
  .leftText {
    font-size: 1.125rem;
  }
}

/* 5) Desktop: split, buttons onder elkaar, sterrenpaneel oproepen */
.rightSection {
  display: none;
}

@media only screen and (min-width: 2024px) {
  .screen {
    flex-direction: row;
  }
  .leftHolder {
    width: 50%;
    align-items: flex-start;
    padding: 64px 80px;
    gap: 80px;
  }
  .logo {
    font-size: 3rem;
    text-align: left;
  }
  .leftText {
    font-size: 1.25rem;
  }
  /* buttons blijven kolom */
  .buttons {
    width: 100%;
    max-width: 400px;
    gap: 24px;
  }
  .loginBtn,
  .guestBtn {
    width: 100%;
  }

  /* rechtersectie */
  .rightSection {
    display: flex;
    width: 50%;
    position: relative;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    /* gradient + static overlay */
    background: var(--gradient-color)
      url('../assets/Overlay-stars.png') no-repeat center center/cover;
  }
  /* canvas achter de titel */
  #starsCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  .starTitle {
    font-family: 'SUNROLL', serif;
    font-size: 4rem;
    color: #ffffff;
    text-align: center;
    padding: 0 40px;
    line-height: 1.1;
  }
}
</style>
