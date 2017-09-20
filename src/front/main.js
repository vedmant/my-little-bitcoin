import Vue from 'vue'
import App from './App.vue'
import router from './router'

import './scss/index.scss'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
