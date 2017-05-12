// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueRouter from 'vue-router'

import home from './home'
import identify from './identify'

import 'normalize.css'
import './index.less'

Vue.config.productionTip = false

Vue.use(VueRouter)

const routes = [
  { path: '/', component: home },
  { path: '/identify', component: identify }
]

const router = new VueRouter({
  routes
})

/* eslint-disable no-new */
new Vue({
  router
}).$mount('#app')
