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
            <router-link to="/sky" class="guestBtn">Continue as guest</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Rechterkant: sterrenhemel met quote -->
    <section class="rightSection">
      <canvas ref="starsCanvas" id="starsCanvas"></canvas>
      <h1 class="starTitle">Write your StOry <br>in the Stars with AStOrya</h1>
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
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* RESET */
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
  height: 100vh;
  overflow: hidden;
  font-family: 'Alice', serif;
}

/* LEFT SIDE */
.leftScrollArea {
  width: 100%;
  background: #fff;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.leftHolder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 90vh;
  min-height: 400px;
  width: 100%;
  max-width: 480px;
  padding: 3vh 4vw;
  overflow: hidden;
}

.logo-img {
  max-width: 100px;
  height: auto;
  margin-bottom: 10px;
}

.pAndB {
  display: flex;
  flex-direction: column;
  gap: 1.2vh;
  width: 100%;
}

.logo {
  font-family: 'SUNROLL', serif;
  font-size: clamp(1.2rem, 2vw, 1.8rem);
  color: #11152A;
  text-align: left;
}

.leftText {
  font-family: 'Alice', serif;
  font-size: clamp(0.7rem, 1vw, 1rem);
  color: #11152A;
  opacity: 0.8;
  text-align: justify;
  line-height: 1.4;
  max-height: 28vh;
  overflow: hidden;
  margin-bottom: 10px;
  overflow-wrap: break-word;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
}

.loginBtn,
.guestBtn {
  display: block;
  width: 100%;
  padding: 0.8rem 0;
  border-radius: 8px;
  text-decoration: none;
  font-family: 'Alice', serif;
  font-weight: bold;
  text-align: center;
  font-size: clamp(0.85rem, 1.2vw, 1.1rem);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.loginBtn {
  background-color: #FEEDB6;
  color: #11152A;
}

.guestBtn {
  background-color: #11152A;
  color: #ffffff;
}

.loginBtn:hover,
.guestBtn:hover {
  opacity: 0.9;
  cursor: pointer;
}

.starTitle {
  display: none;
}

/* TABLET */
@media only screen and (min-width: 778px) {
  .leftHolder {
    max-width: 580px;
    padding: 3vh 6vw;
  }
}

/* DESKTOP */
@media only screen and (min-width: 1024px) {
  .screen {
    flex-direction: row;
  }

  .leftScrollArea {
    width: 50%;
    height: 100vh;
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
