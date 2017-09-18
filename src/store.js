const {BlockError, TransactionError} = require('./errors');
const bus = require('./bus');
const config = require('./config');
const {isChainValid} = require('./lib/chain');
const {checkBlock, makeGenesisBlock} = require('./lib/block');
const {checkTransaction, buildTransaction} = require('./lib/transaction');
const {generateKeyPair} = require('./lib/wallet');

const store = {
  difficulty: 100000, // The less value the bigger difficulty

  chain: [makeGenesisBlock()],

  mempool: [], // This is pending transactions that will be added to the next block

  peers: config.initialPeers, // List of peers ['ip:port']

  wallet: generateKeyPair(),

  /*
   * Getters
   */

  lastBlock () {
    return this.chain[this.chain.length - 1];
  },

  blocksAfter (index) {
    if (index >= this.chain.length) return [];
    return this.chain.slice(index);
  },

  isChainValid () {
    return isChainValid(this.chain, this.difficulty);
  },

  getUnspent (withMempool = false) {
    let transactions = this.chain.reduce((transactions, block) => transactions.concat(block.transactions), []);
    if (withMempool) transactions = transactions.concat(this.mempool);
    // Find all inputs with their tx ids
    const inputs = transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), []);

    // Find all outputs with their tx ids
    const outputs = transactions.reduce((outputs, tx) =>
      outputs.concat(tx.outputs.map(o => Object.assign({}, o, {tx: tx.id}))), []);

    const unspent = outputs.filter(output =>
      typeof inputs.find(input => input.tx === output.tx && input.index === output.index && input.amount === output.amount) === 'undefined');

    return unspent;
  },

  getUnspentForAddress (address) {
    return this.getUnspent(true).filter(u => u.address === address);
  },

  getBalanceForAddress (address) {
    return this.getUnspentForAddress(address).reduce((acc, u) => acc + u.amount, 0);
  },

  getBalance () {
    return this.getBalanceForAddress(this.wallet.public);
  },

  /*
   * Actions
   */

  addBlock (block) {
    try {
      checkBlock(this.lastBlock(), block, this.difficulty, this.getUnspent());
      this.chain.push(block); // Push block to the chain
      this.cleanMempool(block.transactions); // Clean mempool
      bus.emit('block-added', block);
      console.log('Added block to the chain ', block);
      return block;
    } catch (e) {
      if (! e instanceof BlockError && ! e instanceof TransactionError) throw e;
      console.error(e);
      return e.message;
    }
  },

  addTransaction (transaction, emit = true) {
    checkTransaction(transaction, this.getUnspent(true));
    // TODO: check if transaction or any intputs are not in mempool already
    this.mempool.push(transaction);
    if (emit) bus.emit('transaction-added', transaction);
    console.log('Added transaction to mempool ', transaction);
  },

  cleanMempool (transactions) {
    transactions.forEach(tx => {
      let index = this.mempool.findIndex(t => t.id === tx.id);
      if (index !== -1) this.mempool.splice(index, 1);
    });
  },

  updateChain (newChain) {
    if (newChain.length > this.chain.length && isChainValid(newChain, this.difficulty)) {
      this.chain = newChain;
      return true;
    }

    return false;
  },

  addPeer (peer) {
    this.peers.push(peer);
  },

  send (toAddress, amount) {
    try {
      const transaction = buildTransaction(this.wallet, toAddress, parseInt(amount), this.getUnspentForAddress(this.wallet.public));
      console.log(transaction);
      this.addTransaction(transaction);
      return 'Transaction added to pool: ' + transaction.id;
    } catch (e) {
      if (! e instanceof TransactionError) throw e;
      console.error(e);
      return e.message;
    }
  },
};

module.exports = store;
