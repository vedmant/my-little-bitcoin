const debug = require('debug')('app:store')
const {TransactionError, GeneralError} = require('./errors')
const {isChainValid} = require('./lib/chain')
const {checkBlock, makeGenesisBlock} = require('./lib/block')
const {checkTransaction, buildTransaction} = require('./lib/transaction')
const {generateKeyPair} = require('./lib/wallet')

module.exports = (config, bus) => ({

  /* ========================================================================= *\
   * State
  \* ========================================================================= */

  difficulty: config.demoMode ? 100000000 : 10000 * 1, // The less value the bigger difficulty

  chain: [makeGenesisBlock()],

  mempool: [], // This is pending transactions that will be added to the next block

  peers: config.initialPeers, // List of peers ['ip:port']

  wallets: [
    {name: 'Main', ...generateKeyPair()},
    {name: 'Wallet 1', ...generateKeyPair()},
    {name: 'Wallet 2', ...generateKeyPair()},
    {name: 'Wallet 3', ...generateKeyPair()},
  ],

  mining: !! config.demoMode,

  /* ========================================================================= *\
   * Getters
  \* ========================================================================= */

  lastBlock () {
    return this.chain[this.chain.length - 1]
  },

  blocksAfter (index) {
    if (index >= this.chain.length) return []
    return this.chain.slice(index)
  },

  getTransactions (withMempool = true) {
    let transactions = this.chain.reduce((transactions, block) => transactions.concat(block.transactions), [])
    if (withMempool) transactions = transactions.concat(this.mempool)

    return transactions
  },

  getTransactionsForAddress (address) {
    return this.getTransactions(false).filter(tx => tx.inputs.find(i => i.address === address) ||
      tx.outputs.find(o => o.address === address))
  },

  getTransactionsForNextBlock () {
    const unspent = this.getUnspent(false)
    return this.mempool.filter(tx => {
      try {
        return checkTransaction(tx, unspent)
      } catch (e) { if (! (e instanceof TransactionError)) throw e }
    })
  },

  getUnspent (withMempool = false) {
    const transactions = this.getTransactions(withMempool)

    // Find all inputs with their tx ids
    const inputs = transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), [])

    // Find all outputs with their tx ids
    const outputs = transactions.reduce((outputs, tx) =>
      outputs.concat(tx.outputs.map(o => Object.assign({}, o, {tx: tx.id}))), [])

    // Figure out which outputs are unspent
    return outputs.filter(output =>
      typeof inputs.find(input => input.tx === output.tx && input.index === output.index && input.amount === output.amount && input.address === output.address) === 'undefined')
  },

  getUnspentForAddress (address) {
    return this.getUnspent(true).filter(u => u.address === address)
  },

  getBalanceForAddress (address) {
    return this.getUnspentForAddress(address).reduce((acc, u) => acc + u.amount, 0)
  },

  /* ========================================================================= *\
   * Actions
  \* ========================================================================= */

  addBlock (block) {
    checkBlock(this.lastBlock(), block, this.difficulty, this.getUnspent())
    this.chain.push(block) // Push block to the chain
    this.cleanMempool(block.transactions) // Clean mempool
    debug(`Added block ${block.index} to the chain`)
    return block
  },

  addTransaction (transaction, byPeer = false) {
    checkTransaction(transaction, this.getUnspent(true))
    // TODO: check if transaction or any intputs are not in mempool already
    this.mempool.push(transaction)

    if (byPeer) bus.emit('transaction-added', transaction)
    else bus.emit('transaction-added-by-me', transaction)

    // Notify about new transaction if one of our wallets recieved funds
    let myWallet = null
    const outputToMyWallet = transaction.outputs.find(output => myWallet = this.wallets.find(w => w.public === output.address))
    if (outputToMyWallet) {
      bus.emit('recieved-funds', {
        name: myWallet.name,
        public: myWallet.public,
        amount: outputToMyWallet.amount,
        balance: this.getBalanceForAddress(myWallet.public),
      })
    }
    debug('Added transaction to mempool ', transaction.id)
  },

  addWallet (wallet) {
    this.wallets.push(wallet)
  },

  cleanMempool (transactions) {
    transactions.forEach(tx => {
      let index = this.mempool.findIndex(t => t.id === tx.id)
      if (index !== -1) this.mempool.splice(index, 1)
    })
  },

  updateChain (newChain) {
    if (newChain.length > this.chain.length && isChainValid(newChain, this.difficulty)) {
      this.chain = newChain
      return true
    }

    return false
  },

  addPeer (peer) {
    this.peers.push(peer)
  },

  send (from, toAddress, amount) {
    const wallet = this.wallets.find(w => w.public === from)
    if (! wallet) throw new GeneralError(`Wallet with address ${from} not found`)
    if (amount <= 0) throw new GeneralError(`Amount should be positive`)

    try {
      const transaction = buildTransaction(wallet, toAddress, parseInt(amount), this.getUnspentForAddress(wallet.public))
      this.addTransaction(transaction)
      bus.emit('balance-updated', {public: wallet.public, balance: this.getBalanceForAddress(wallet.public)})
      return 'Transaction added to pool: ' + transaction.id
    } catch (e) {
      if (! (e instanceof TransactionError)) throw e
      console.error(e)
      throw new GeneralError(e.message)
    }
  },
})
