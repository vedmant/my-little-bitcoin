const {BlockError, TransactionError} = require('./errors');
const {isChainValid} = require('./lib/chain');
const {checkBlock, makeGenesisBlock} = require('./lib/block');
const {checkTransaction} = require('./lib/transaction');
const {generateKeyPair} = require('./lib/wallet');

const store = {
  difficulty: 100000, // The less value the bigger difficulty

  chain: [makeGenesisBlock()],

  mempool: [], // This is pending transactions that will be added to the next block

  unspent: [], // This is all unspent transactions to calculate wallet balance, validate new transactions

  peers: [], // List of peers ['ip:port']

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

  /*
   * Actions
   */

  addBlock (block) {
    try {
      checkBlock(this.lastBlock(), block, this.difficulty);
      this.chain.push(block);
      this.cleanTransactions(block.transactions);
      this.updateUnspent(block);
      console.log('Added block to the chain ', block);
    } catch (error) {
      if (! error instanceof BlockError && ! error instanceof TransactionError) throw error;
      console.error(error);
    }
  },

  addTransaction (transaction) {
    try {
      checkTransaction(transaction);
      this.mempool.push(transaction);
      console.log('Added transaction to mempool ', transaction);
    } catch (error) {
      if (error instanceof TransactionError) throw error;
      console.error(error);
    }
  },

  cleanTransactions (transactions) {
    transactions.forEach(tx => {
      let index = this.mempool.findIndex(t => t.id === tx.id);
      if (index !== -1) this.mempool.splice(index, 1);
    });
  },

  updateUnspent (block) {
    // Find all inputs with their tx ids
    const inputs = block.transactions.reduce((inputs, tx) =>
      inputs.concat(tx.inputs.map(i => Object.assign({}, i, {tx: tx.id}))), []);

    // Remove inputs from unspent
    inputs.forEach(inp => {
      let index = this.unspent.findIndex(t => t.tx === inp.tx);
      if (index !== -1) this.unspent.splice(index, 1);
    });

    // Find all outputs with ther tx ids
    const outputs = block.transactions.reduce((outputs, tx) =>
      outputs.concat(tx.outputs.map(o => Object.assign({}, o, {tx: tx.id}))), []);

    // Add to unspent
    this.unspent = this.unspent.concat(outputs);
  },

  getUnspentForAddress (address) {
    return this.unspent.filter(u => u.address === address);
  },

  getBalanceForAddress (address) {
    return this.getUnspentForAddress(address).reduce((acc, u) => acc + u.amount, 0);
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
};

module.exports = store;
