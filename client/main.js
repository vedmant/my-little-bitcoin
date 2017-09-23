import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './ws'
import 'jquery'
import BootstrapVue from 'bootstrap-vue'
import './scss/index.scss'

Vue.use(BootstrapVue)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
})
