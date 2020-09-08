<template>
  <div class='hello'>
    <h1>{{ msg }}</h1>
    <canvas id='mainStage' width='1000' height='1000' />
    <input type="range" min="0.1" max="2.0" value="1.0" step = 0.1 class="slider" id="tempRange"> 
    <span id="tempValue">1.0</span>
  </div>
</template>

<script>
import { startNoteWriter } from "../game/entry.js";
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
    let slider = document.getElementById("tempRange");
    let output = document.getElementById("tempValue");
    output.innerHTML = slider.value;
    slider.oninput = function() {
      output.innerHTML = this.value;
    };
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
