import io from 'socket.io-client'
import store from './store'

const socket = io()

socket.on('block-added', (block) => {
  store.commit('ADD_BLOCK', block)
  store.commit('CLEAN_MEMPOOL')
})

socket.on('block-added-by-me', (block) => {
  store.dispatch('addToastMessage', {text: `You mined a new block, index: ${block.index}`, type: 'success'})
  store.commit('ADD_BLOCK', block)
  store.commit('CLEAN_MEMPOOL')
})

socket.on('transaction-added', (transaction) => store.commit('ADD_TRANSACTION', transaction))
socket.on('balance-updated', (balance) => store.commit('UPDATE_BALANCE', balance))
socket.on('mine-started', () => store.commit('MINE_START'))
socket.on('mine-stopped', () => store.commit('MINE_STOP'))
socket.on('recieved-funds', (data) => {
  store.commit('RECIEVED_FUNDS', data)
  store.dispatch('addToastMessage', {text: `You just recieved ${data.amount} to wallet: ${data.name}!`, type: 'success'})
})
