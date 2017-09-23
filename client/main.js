import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './ws'
import 'jquery'
import BootstrapVue from 'bootstrap-vue'

Vue.use(BootstrapVue);

import './scss/index.scss'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
