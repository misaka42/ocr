<template>
  <div id="lib">
    <canvas ref="cvs"></canvas>
  </div>
</template>

<script>
import util from './util'
const config = util.config

export default {
  name: 'lib',
  data () {
    return {}
  },
  mounted () {
    this.$nextTick(() => {
      Object.assign(this.$refs.cvs, config.canvas)
      this.$refs.cvs.style.width = config.canvas.width + 'px'
      this.$refs.cvs.style.height = config.canvas.height + 'px'
      this.ctx = this.$refs.cvs.getContext('2d')
      this.init()
    })
  },
  methods: {
    init () {
      for (let i = 48; i < 123; i++) {
        this.getStringData(String.fromCharCode(i))
      }
    },
    getStringData (str) {
      this.ctx.clearRect(0, 0, config.canvas.width, config.canvas.height)
      this.ctx.font = `100 ${config.canvas.width / 2}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.fillStyle = '#000000'
      this.ctx.fillText(str, config.canvas.width / 2, config.canvas.height / 2)
      const rect = util.adjustGrid(util.detect(this.ctx.getImageData(0, 0, config.canvas.width, config.canvas.height)))
      const imgData = this.ctx.getImageData(rect.X, rect.Y, rect.size, rect.size)
      window.lib.push({
        value: str,
        data: util.generateGridData(imgData.data, rect.size),
        img: this.getImageDataUrl(imgData)
      })
    },
    getImageDataUrl (imgData) {
      const cvs = document.createElement('canvas')
      cvs.width = imgData.width
      cvs.height = imgData.height
      const ctx = cvs.getContext('2d')
      ctx.putImageData(imgData, 0, 0)
      return cvs.toDataURL()
    }
  }
}
</script>

<style lang="less">
  #lib {
    display: none;
  }
</style>
