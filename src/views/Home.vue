<!-- src/views/Home.vue -->
<template>
  <div class="screen">
    <div class="leftHolder">
      <img src="../assets/Logo.svg" alt="Astorya Logo" class="logo-img"/>
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

    <div class="rightHolder">
      <h2>Write your story in the stars with Astorya</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
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

/* 3) Mobile-first layout */
.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
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

/* rightHolder is hidden on mobile */
.rightHolder {
  display: none;
}

/* 4) Tablet breakpoint */
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
  .buttons {
    flex-direction: row;
    justify-content: center;
  }
  .loginBtn,
  .guestBtn {
    width: auto;
    flex: 1;
    margin: 0 8px;
    padding: 16px 0;
  }
}

/* 5) Desktop breakpoint */
@media only screen and (min-width: 2024px) {
  .screen {
    flex-direction: row;
  }
  .leftHolder {
    width: 50%;
    align-items: flex-start;
    padding: 64px 80px;
  }
  .pAndB {
    gap: 80px;
  }
  .logo {
    text-align: left;
    font-size: 3rem;
  }
  .leftText {
    font-size: 1.25rem;
  }
  .buttons {
    justify-content: flex-start;
  }
  .loginBtn,
  .guestBtn {
    margin: 0 20px 0 0;
    flex: 0 0 auto;
  }

  .rightHolder {
    display: flex;
    width: 50%;
    justify-content: flex-end;
    align-items: flex-end;

    /* gradient + star-overlay */
    background: var(--gradient-color) url("../assets/vailStars.svg")
      center/cover no-repeat;
  }
  .rightHolder h2 {
    font-family: 'SUNROLL', serif;
    font-size: 60px;
    color: #ffffff;
    padding: 80px;
    text-align: right;
    line-height: 1.1;
  }
}
</style>
