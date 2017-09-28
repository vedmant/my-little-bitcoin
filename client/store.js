import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import co from 'co'
import Axios from 'axios'
import toast from './vuex/toast'

Vue.use(Vuex)

const state = {
  loading: false,
  time: [],
  chain: [],
  mempool: [],
  wallets: [],
  stats: [],
  mining: false,
  demoMode: false,
  block: {},
  address: {},
  transaction: {transaction: {inputs: [], outputs: []}, block: {}},
}

const actions = {

  getStatus ({commit}) {
    commit('GET_STATUS')

    return co(function* () {
      const resp = yield Axios.get('/v1/status')
      commit('GET_STATUS_OK', resp.data)
    })
  },

  startMine ({commit}) {
    return co(function* () {
      yield Axios.get('/v1/mine-start')
    })
  },

  stopMine ({commit}) {
    return co(function* () {
      yield Axios.get('/v1/mine-stop')
    })
  },

  sendFunds ({commit}, {from, to, amount}) {
    return co(function* () {
      yield Axios.get(`/v1/send/${from}/${to}/${amount}`)
    })
  },

  getBlock ({commit}, index) {
    commit('GET_BLOCK')

    return co(function* () {
      const resp = yield Axios.get('/v1/block/' + index)
      commit('GET_BLOCK_OK', resp.data.block)
    })
  },

  getAddress ({commit}, address) {
    commit('GET_ADDRESS')

    return co(function* () {
      const resp = yield Axios.get('/v1/address/' + address)
      commit('GET_ADDRESS_OK', resp.data)
    })
  },

  getTransaction ({commit}, id) {
    commit('GET_TRANSACTION')

    return co(function* () {
      const resp = yield Axios.get('/v1/transaction/' + id)
      commit('GET_TRANSACTION_OK', resp.data)
    })
  },

  getWallets ({commit}) {
    commit('GET_WALLETS')

    return co(function* () {
      const resp = yield Axios.get('/v1/wallets')
      commit('GET_WALLETS_OK', resp.data)
    })
  },

  createWallet ({commit}, name) {
    commit('CREATE_WALLET')

    return co(function* () {
      const resp = yield Axios.post('/v1/wallet/create', {name})
      commit('CREATE_WALLET_OK', resp.data)
    })
  },
}

const mutations = {

  GET_STATUS (state) {
    state.loading = true
  },

  GET_STATUS_OK (state, status) {
    state.loading = false
    state.time = status.time
    state.chain = status.chain
    state.mempool = status.mempool
    state.wallets = status.wallets
    state.mining = status.mining
    state.demoMode = status.demoMode
  },

  ERROR (state) {
    state.loading = false
  },

  ADD_BLOCK (state, block) {
    state.chain.push(block)
    state.chain = state.chain.slice(Math.max(state.chain.length - 5, 0))
  },

  ADD_TRANSACTION (state, transaction) {
    state.mempool.push(transaction)
    state.mempool = state.mempool.slice(Math.max(state.mempool.length - 5, 0))
  },

  CLEAN_MEMPOOL (state, transactions) {
    transactions.forEach(tx => {
      let index = state.mempool.findIndex(t => t.id === tx.id)
      if (index !== -1) state.mempool.splice(index, 1)
    })
  },

  UPDATE_BALANCE (state, balance) {
    const index = state.wallets.findIndex(w => w.public === balance.public)
    if (index === -1) return console.error('Cant find wallet to update balance')
    state.wallets[index].balance = balance.balance
  },

  MINE_START (state) {
    state.mining = true
  },

  MINE_STOP (state) {
    state.mining = false
  },

  RECIEVED_FUNDS (state, data) {
    const index = state.wallets.findIndex(w => w.public === data.public)
    if (index === -1) return console.error('Cant find wallet to update balance')
    state.wallets[index].balance = data.balance
  },

  GET_BLOCK (state) {
    state.loading = true
  },

  GET_BLOCK_OK (state, block) {
    state.loading = false
    state.block = block
  },

  GET_ADDRESS (state) {
    state.loading = true
  },

  GET_ADDRESS_OK (state, address) {
    state.loading = false
    state.address = address
  },

  GET_TRANSACTION (state) {
    state.loading = true
  },

  GET_TRANSACTION_OK (state, transaction) {
    state.loading = false
    state.transaction = transaction
  },

  GET_WALLETS (state) {
    state.loading = true
  },

  GET_WALLETS_OK (state, wallets) {
    state.loading = false
    state.wallets = wallets
  },

  CREATE_WALLET (state) {
    state.loading = true
  },

  CREATE_WALLET_OK (state, wallet) {
    state.loading = false
    state.wallets.push(wallet)
  },
}

const debug = process.env.NODE_ENV !== 'production'

const store = new Vuex.Store({
  strict: debug,
  plugins: debug ? [createLogger()] : [],
  state,
  mutations,
  actions,
  modules: {toast},
})

Axios.interceptors.response.use(function (response) {
  // Do something with response data
  return response
}, function (error) {
  store.dispatch('addToastMessage', {type: 'danger', text: error.response.data})
  store.commit('ERROR', error)
  return Promise.reject(error)
})

export default store
