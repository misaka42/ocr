<template>
  <div id="ocr">
    <canvas ref="cvs"
      @mousemove="mousemove"
      @touchmove="mousemove"
      @mousedown="drawingEnable"
      @touchstart="drawingEnable"
      @mouseup="drawingDisable"
      @touchend="drawingDisable"
      @mouseleave="drawingDisable">
    </canvas>
    <div class="desc">
      <h5>STEPS</h5>
      <ol>
        <li v-for="(s, index) in steps" :class="{ active: index <= step }">{{s}}</li>
      </ol>
      <ul v-if="showResult" class="result">
        <li v-for="r in lib" @click="pick(r)" @mouseenter="preview(r)">
          <img :src="r.img" :alt="r.value">
          <span>{{r.acc}}</span>
          <img class="preview" :src="r.img" :alt="r.value">
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
      lib: util.fontLib,
      showResult: false
    }
  },
  mounted () {
    for (let i = 48; i < 91; i++) {
      if (i > 57 && i < 65) {
        continue
      }
      util.addFont(String.fromCharCode(i), `sans-serif`)
    }

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
        if (e.touches && e.touches[0]) {
          e.offsetX = e.touches[0].pageX
          e.offsetY = e.touches[0].pageY
        }
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
      util.fixFont(v, this.gridData)
      this.reset()
    },
    preview (v) {
      util.clearCanvas(this.$refs.cvs)
      this.drawUserGridData()
      util.drawGridData({
        cvs: this.$refs.cvs,
        gridData: v.data,
        rect: this.detect,
        compare: this.gridData,
        fillStyle: (a, b) => b > 0 ? `rgba(0, 255, 0, ${a === 0 ? 0 : 1 - Math.abs(a - b)})` : `rgba(255, 0, 0, ${a})`
      })
    },
    drawUserGridData () {
      util.drawGridData({
        cvs: this.$refs.cvs,
        gridData: this.gridData,
        rect: this.detect,
        fillStyle: v => `rgba(0, 0, 0, ${v})`
      })
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
      this.gridData = util.generateGridData(this.ctx.getImageData(this.detect.X, this.detect.Y, this.detect.size, this.detect.size).data, this.detect.size)
      util.clearCanvas(this.$refs.cvs)
      this.drawUserGridData()
    },
    step4 () {
      this.lib.forEach(v => {
        v.acc = util.compareArray(this.gridData, v.data)
      })
      this.lib.sort((a, b) => b.acc - a.acc)
      this.showResult = true

      this.preview(this.lib[0])
    }
  }
}
</script>

<style lang="less">
  body, html {
    margin: 0;
    padding: 0;
    font: 300 1em/1.8 PingFang SC, Lantinghei SC, Microsoft Yahei, Hiragino Sans GB, Microsoft Sans Serif, WenQuanYi Micro Hei, sans-serif;
  }
  #ocr {
    // display: flex;
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
      position: relative;
      height: 30px;
      line-height: 30px;
      display: inline-block;
      img {
        height: 100%;
      }
      &:hover {
        background-color: #ddd;
        .preview {
          display: block;
          position: absolute;
          top: 0;
          right: -200px;
          height: 200px;
        }
      }
      .preview {
        display: none;
      }
    }
  }
</style>
