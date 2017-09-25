import Vue from 'vue'
import Router from 'vue-router'
import Status from './components/Status.vue'
import Block from './components/Block.vue'
import Page404 from './components/404.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {path: '/', name: 'Status', component: Status},
    {path: '/block/:index', name: 'Block', component: Block},
    {path: '*', component: Page404},
  ],
})
