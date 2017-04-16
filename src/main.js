// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import ocr from './ocr'
import lib from './lib'

Vue.config.productionTip = false

window.lib = []

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<div><lib/><ocr/></div>',
  components: { lib, ocr }
})
