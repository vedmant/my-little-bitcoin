import Vue from 'vue'
import Router from 'vue-router'
import Status from './components/Status.vue'
import Block from './components/Block.vue'
import Address from './components/Address.vue'
import Transaction from './components/Transaction.vue'
import Wallets from './components/Wallets.vue'
import Page404 from './components/404.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {path: '/', name: 'Status', component: Status},
    {path: '/block/:index', name: 'Block', component: Block},
    {path: '/address/:address', name: 'Address', component: Address},
    {path: '/transaction/:id', name: 'Transaction', component: Transaction},
    {path: '/wallets', name: 'Wallets', component: Wallets},
    {path: '*', component: Page404},
  ],
})
