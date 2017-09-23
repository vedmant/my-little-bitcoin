import Vue from 'vue'
import Router from 'vue-router'
import Status from './components/Status.vue'
import Page404 from './components/404.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {path: '/', name: 'Status', component: Status},
    {path: '*', component: Page404},
  ]
})
