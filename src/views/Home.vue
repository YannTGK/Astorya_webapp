<!-- src/views/Home.vue -->
<template>
    <div class="screen">
        <div class="leftHolder">
            <img src="../assets/Logo.svg" alt="Astorya Logo">
            <div class="pAndB">
                <div class="text" >
                    <h1 class="logo">HOME Welkom bij de Sterrenhemel</h1>
                    <p class="leftText">
                        Our webapp offers an immersive VR experience directly through your browser. By entering the VR mode, you can explore the virtual environment in 360°, interact with stars, and experience the memories in a more engaging way.
                        <br><br>
                        Don’t have a VR headset? You can still explore in 3D using the joystick.
                    </p>
                </div>
                <div class="buttons">
                    <router-link to="/login" class="loginBtn">Login</router-link>
                </div>
            </div>
        </div>
        <div class="rightHolder">
            <h2> Write Your story in the stars with Astorya </h2>
        </div>
    </div>
</template>

<style scoped>
    * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .screen {
    display: flex;
    flex-direction: row;
    
    align-items: center;
    width: 100%;
    height: 100vh;
  }
  .leftHolder {
    width: 50%; 
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64px 80px;
    gap: 60px;
  }
  .pAndB {
    display: flex;
    flex-direction: column;
    gap: 80px
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 24px
  }
  .leftText {
    font-size: 20px;
    text-align: justify;
    opacity: 0.8;
  }
  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 20px;
    text-align: center;
  }
  .loginBtn {
    background-color: #FEEDB6;
    color: #11152A;
    flex: 1;
    padding: 20px 20px;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
  }
  .rightHolder {
    width: 50%;
    background-color: #11152A;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    background-image: url("../assets/vailStars.svg");
  }
  h2 {
    color: #ffffff;
    font-size: 60px;
    padding: 80px 80px;
  }
</style>
  