<template>
  <div id="ocr">
    <canvas ref="cvs" @mousemove="mousemove" @mousedown="drawingEnable" @mouseup="drawingDisable" @mouseleave="drawingDisable"></canvas>
    <div class="desc">
      <h5>STEPS</h5>
      <ol>
        <li v-for="(s, index) in steps" :class="{ active: index <= step }">{{s}}</li>
      </ol>
      <ul v-if="showResult" class="result">
        <li v-for="r in lib" @click="pick(r)">
          <img :src="r.img" :alt="r.value">
          <span>{{r.acc}}%</span>
        </li>
      </ul>
    </div>
    <button @click="runStep" v-if="this.step < this.steps.length - 1">next step</button>
  </div>
</template>

<script>
import util from './util'
const config = util.config

export default {
  name: 'ocr',
  data () {
    return {
      drawing: false,
      steps: ['draw text', 'detect text area', 'adjust grid', 'split', 'compare'],
      step: 0,
      detect: {},
      lib: window.lib,
      showResult: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      Object.assign(this.$refs.cvs, config.canvas)
      this.$refs.cvs.style.width = config.canvas.width + 'px'
      this.$refs.cvs.style.height = config.canvas.height + 'px'
      this.ctx = this.$refs.cvs.getContext('2d')
    })
  },
  methods: {
    mousemove (e) {
      if (this.drawing) {
        this.ctx.beginPath()
        this.ctx.arc(e.offsetX, e.offsetY, config.pen.size, 0, Math.PI * 2)
        this.ctx.fillStyle = config.pen.fillStyle
        this.ctx.fill()
      }
    },
    drawingEnable () {
      this.drawing = true
    },
    drawingDisable () {
      this.drawing = false
    },
    pick (v) {
      v.data = util.combineArray(v.data, this.gridData)
      this.reset()
    },
    reset () {
      this.step = 0
      this.showResult = false
      this.ctx.clearRect(0, 0, config.canvas.width, config.canvas.height)
    },
    runStep () {
      if (this.autosave === undefined) {
        this.autosave = {}
      }

      if (this.step < this.steps.length - 1) {
        this.autosave[this.step] = this.ctx.getImageData(0, 0, config.canvas.width, config.canvas.height)
        this['step' + String(++this.step)]()
      }
    },
    step1 () {
      const imgData = this.ctx.getImageData(0, 0, config.canvas.width, config.canvas.height)
      this.detect = util.detect(imgData)

      // draw detect area
      this.ctx.strokeStyle = config.pen.strokeStyle
      this.ctx.strokeRect(this.detect.X, this.detect.Y, this.detect.size, this.detect.size)
    },
    step2 () {
      this.ctx.putImageData(this.autosave[0], 0, 0)
      this.detect = util.adjustGrid(this.detect)
      this.ctx.strokeRect(this.detect.X, this.detect.Y, this.detect.size, this.detect.size)

      const { X, Y, size } = this.detect
      const step = size / config.grid
      // draw line on yAxis
      for (let i = Y; i < Y + size; i += step) {
        this.ctx.beginPath()
        this.ctx.moveTo(X, i)
        this.ctx.lineTo(X + size, i)
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }
      // draw line on xAxis
      for (let i = X; i < X + size; i += step) {
        this.ctx.beginPath()
        this.ctx.moveTo(i, Y)
        this.ctx.lineTo(i, Y + size)
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }
    },
    step3 () {
      this.ctx.putImageData(this.autosave[0], 0, 0)
      const gridData = util.generateGridData(this.ctx.getImageData(this.detect.X, this.detect.Y, this.detect.size, this.detect.size).data, this.detect.size)
      const step = this.detect.size / config.grid
      gridData.forEach((v, i) => {
        if (v > config.like) {
          this.ctx.fillStyle = `rgba(0, 0, 0, ${parseFloat(v).toFixed(2)})`
        } else {
          this.ctx.fillStyle = '#fff'
        }
        this.ctx.fillRect(
          this.detect.X + (i % config.grid) * step,
          this.detect.Y + parseInt(i / config.grid) * step,
          step,
          step
        )
      })
      this.gridData = gridData
    },
    step4 () {
      this.lib.forEach(v => {
        v.acc = util.compareArray(this.gridData, v.data)
      })
      this.lib.sort((a, b) => b.acc - a.acc)
      this.showResult = true

      const arr = this.lib[0].data
      const step = this.detect.size / config.grid
      for (let y = 0; y < config.grid; y++) {
        for (let x = 0; x < config.grid; x++) {
//          if (arr[x + config.grid * y] > config.like) {
          this.ctx.fillStyle = `rgba(255, 0, 0, ${arr[x + config.grid * y]})`
          this.ctx.fillRect(this.detect.X + x * step, this.detect.Y + y * step, step, step)
//          }
        }
      }
    }
  }
}
</script>

<style lang="less">
  body, html {
    font: 300 1em/1.8 PingFang SC, Lantinghei SC, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif;
  }
  #ocr {
    display: flex;
  }
  canvas {
    border: 1px solid #ddd;
  }
  ol {
    .active {
      color: red;
    }
  }
  h5 {
    text-align: center;
  }
  .result {
    margin: 0;
    padding: 0;
    list-style: none;
    li {
      height: 30px;
      line-height: 30px;
      img {
        height: 100%;
      }
      &:hover {
        background-color: #ddd;
      }
    }
  }
</style>
