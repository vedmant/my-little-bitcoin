import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger';
import co from 'co'
import Axios from 'axios'

Vue.use(Vuex);

const state = {

  loading: false,

  chain: [],

  mempool: [],

  wallets: [],

  stats: [],

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
  },

  ERROR (state) {
    state.loading = false
  }
}

const actions = {

  getState({commit}) {
    commit('GET_STATUS')

    return co(function* () {
      const resp = yield Axios.get('/v1/status')
      commit('GET_STATUS_OK', resp.data)
    }).catch(e => commit('ERROR', e));
  }

}

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  strict: debug,
  plugins: debug ? [createLogger()] : [],
  state,
  mutations,
  actions,
});
