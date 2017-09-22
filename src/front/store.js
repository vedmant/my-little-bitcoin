import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger';
import co from 'co'
import Axios from 'axios'
import toast from './vuex/toast'

Vue.use(Vuex);

const state = {

  loading: false,

  chain: [],

  mempool: [],

  wallets: [],

  stats: [],

  mining: false,

}

const mutations = {
  GET_STATUS (state) {
    state.loading = true
  },

  GET_STATUS_OK (state, status) {
    state.loading = false
    state.chain = status.chain
    state.mempool = status.mempool
    state.wallets = status.wallets
    state.mining = status.mining
  },

  ERROR (state) {
    state.loading = false
  },

  ADD_BLOCK (state, block) {
    state.chain.push(block);
    state.chain = state.chain.slice(Math.max(state.chain.length - 5, 0));
  },

  ADD_TRANSACTION (state, transaction) {
    state.mempool.push(transaction);
    state.mempool = state.mempool.slice(Math.max(state.mempool.length - 5, 0));
  },

  CLEAN_MEMPOOL (state) {
    state.mempool = []
  },

  UPDATE_BALANCE (state, balance) {
    const index = state.wallets.findIndex(w => w.public === balance.address)
    state.wallets[index].balance = balance.balance
  },

  MINE_START (state) {
    state.mining = true
  },

  MINE_STOP (state) {
    state.mining = false
  },
}

const actions = {

  getState({commit}) {
    commit('GET_STATUS')

    return co(function* () {
      const resp = yield Axios.get('/v1/status')
      commit('GET_STATUS_OK', resp.data)
    }).catch(e => commit('ERROR', e));
  },

  startMine({commit}) {
    return co(function* () {
      yield Axios.get('/v1/mine-start')
    }).catch(e => commit('ERROR', e));
  },

  stopMine({commit}) {
    return co(function* () {
      yield Axios.get('/v1/mine-stop')
    }).catch(e => commit('ERROR', e));
  },

}

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  strict: debug,
  plugins: debug ? [createLogger()] : [],
  state,
  mutations,
  actions,
  modules: {toast}
});
