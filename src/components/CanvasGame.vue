<template>
  <div class='hello'>
    <h1>{{ msg }}</h1>
    <canvas id='mainStage' width='1000' height='1000' />
  </div>
</template>

<script>
import { startNoteWriter } from "../game/gamelogic.js";
export default {
  name: "CanvasGame",
  props: {
    msg: String,
  },
  methods: {
    start: function () {
      startNoteWriter();
    },
  },
  //   mounted() {
  //     this.$nextTick(() => {
  //       this.start();
  //     });
  //   },
  mounted: function () {
    this.start();
  },
  //   mounted() {
  //     let recaptchaScript = document.createElement("script");
  //     recaptchaScript.setAttribute("src", "js/engine.js");
  //     document.head.appendChild(recaptchaScript);
  //   },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
canvas {
  border: 1px solid #d3d3d3;
  background-color: #f1f1f1;
}
</style>
