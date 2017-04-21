<template>
  <div id="home">
    <canvas ref="cvs"></canvas>
    <p id="msg">{{msg}}</p>
    <div id="match" v-show="state === 2">
      <canvas ref="match"></canvas>
      <img ref="img" :src="imgSrc" alt="img">
    </div>
    <div id="btns" v-show="state === 2">
      <button @click="confirm">是</button>
      <button @click="reset">否</button>
    </div>
  </div>
</template>

<script>
  import Canvas from './Canvas'
  import lib from './lib'

  const config = lib.config

  const STATE_MSG = {
    0: '正在初始化数据...',
    1: '在上方画布开始绘画',
    2: '识别是否准确？'
  }

  export default {
    data () {
      return {
        state: 0,
        fontLib: lib.fontLib,
        imgSrc: ''
      }
    },
    computed: {
      msg () {
        return STATE_MSG[this.state]
      }
    },
    created () {
      setTimeout(() => {
        lib.initFontLib()
        this.state = 1
      }, 0)
    },
    mounted () {
      this.$nextTick(this.init)
    },
    methods: {
      init () {
        this._canvas = new Canvas(this.$refs.cvs)
        this._match = new Canvas(this.$refs.match, config.grid * 4)

        this._canvas.callback.finish = data => {
          this.state = 2
          const matched = lib.findMatch(data)
          lib.setSize(this.$refs.img, config.grid * 4)
          this.imgSrc = matched.img

          lib.drawArea({
            cvs: this.$refs.match,
            data: data,
            area: { x: 0, y: 0, size: this.$refs.match.width },
            compare: matched.data,
            style: (a, b) => {
              if (a === 0 && b > 0) {
                return `rgba(255, 0, 0, ${b / 2})`
              }
              if (b === 0 && a > 0) {
                return `rgba(0, 0, 0, ${a})`
              }
              if (a === 0 && b === 0) {
                return '#fff'
              }
              return `rgba(0, 255, 0, ${1 - Math.abs(a - b)})`
            }
          })
        }
      },

      reset () {
        this.state = 1
        this._canvas.clear()
      },

      confirm () {
        this.state = 1
        this._canvas.clear()
      }
    }
  }
</script>
