<template>
  <div class="screen">
    <!-- Linkerkant: content -->
    <div class="leftScrollArea">
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
    </div>

    <!-- Rechterkant: sterrenhemel met quote -->
    <section class="rightSection">
      <canvas ref="starsCanvas" id="starsCanvas"></canvas>
      <h1 class="starTitle">Write your story<br>in the stars with Astorya</h1>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home',
  mounted() {
    const canvas = this.$refs.starsCanvas;
    const ctx = canvas.getContext('2d');
    let stars = [];
    const numStars = 200;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initStars();
    };

    const initStars = () => {
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
    };

    const drawStars = () => {
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
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawStars();
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Alice&display=swap');

@font-face {
  font-family: 'SUNROLL';
  src: url('@/fonts/SUNROLL.TTF') format('truetype');
}

html, body {
  max-width: 100vw;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

/* BASIC RESET */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* STRUCTURE */
.screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

/* LEFT SIDE */
.leftScrollArea {
  width: 100%;
  background: #fff;
}

.leftHolder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 32px 16px;
  gap: 32px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
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
  font-size: 1.25rem;
}

.loginBtn {
  background-color: #FEEDB6;
  color: #11152A;
}

.guestBtn {
  background-color: #11152A;
  color: #ffffff;
}

.starTitle {
  display: none;
}

/* TABLET */
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

/* DESKTOP */
@media only screen and (min-width: 1024px) {
  .screen {
    flex-direction: row;
    height: 100vh;
    overflow: hidden;
  }

  .leftScrollArea {
    width: 50%;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
  }

  .leftHolder {
    justify-content: center;
    align-items: center;
    height: auto;
    max-width: 480px;
    margin: auto;
    padding: 64px 40px;
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
    font-size: 2rem;
    color: #ffffff;
    text-align: left;
    z-index: 1;
    padding: 0 40px 40px 40px;
    line-height: 1.4;
    white-space: pre-line;
  }
}

/* MOBILE/TABLET FIXES */
@media only screen and (max-width: 1023px) {
  .screen {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .leftScrollArea {
    width: 100%;
    background: #fff;
  }

  .leftHolder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 32px 16px;
    gap: 24px;
  }
}
</style>
