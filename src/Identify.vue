<template>
  <div id="Identify">
    <div class="title"><router-link to="/">返回</router-link>选择你想画的图形</div>
    <div class="imgs">
      <div v-for="item in list" class="img-box" @click="pick(item)" :class="{ active: item === pickedItem }">
        <img :src="item.img" :alt="item.value">
        <i>{{item.acc}}</i>
      </div>
    </div>
    <div class="confirm" v-show="pickedItem">
      <ul class="tips">
        <li>你画的区域</li>
        <li>字符的区域</li>
        <li>重叠的区域</li>
      </ul>
      <canvas ref="cvs"></canvas>
      <div class="desc">
        <div>字符 {{pickedItem && pickedItem.value}}</div>
        <div>符合率 {{pickedItem && pickedItem.acc}}</div>
      </div>
      <div class="bottom-btn-group">
        <button @click="confirm">就他了</button>
        <button @click="reset">还是算了</button>
      </div>
    </div>
    <div class="btn" @click="custom">这里没有朕想要的</div>
  </div>
</template>

<script>
  import lib from './lib'
  import Canvas from './Canvas'

  export default {
    data () {
      return {
        list: lib.fontLib,
        pickedItem: null
      }
    },

    methods: {
      pick (item) {
        if (this.pickedItem === item) {
          this.pickedItem = null
        } else {
          this.pickedItem = item
          const cvs = new Canvas(this.$refs.cvs, 200)
          lib.drawArea({
            cvs: cvs.cvs,
            data: lib.userDraw.data,
            compare: item.data,
            area: { x: 0, y: 0, size: cvs.cvs.width },
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
      confirm () {
        lib.fixFont(this.pickedItem, 0.7)
        this.pickedItem = null
        this.$router.push({ path: '/' })
      },
      reset () {
        this.pickedItem = null
      },
      custom () {
        lib.addCustomFont(window.prompt('给你画的东西起个名字吧'))
      }
    }
  }
</script>
