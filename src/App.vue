<template>
  <div id='app'>
    <!-- <img alt='Vue logo' src='./assets/logo.png' /> -->
    <CanvasGame msg='Welcome to Note Writer, Press Space to Play' />
  </div>
</template>

<script>
import CanvasGame from "./components/CanvasGame.vue";

export default {
  name: "App",
  components: {
    CanvasGame,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
