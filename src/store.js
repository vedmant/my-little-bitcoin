const {isChainValid} = require('./util/chain');
const {isDataValid, isBlockValid, makeGenesisBlock} = require('./util/block');
const {generateKeyPair} = require('./util/wallet');

const store = {
  difficulty: 10000, // The less value the bigger difficulty

  chain: [makeGenesisBlock()],

  mempool: [], // This is pending transactions that will be added to the next block

  peers: [], // List of peers ['ip:port']

  wallet: generateKeyPair(),

  /*
   * Getters
   */

  lastBlock() {
    return this.chain[this.chain.length - 1];
  },

  blocksAfter(index) {
    if (index >= this.chain.length) return [];
    return this.chain.slice(index);
  },

  isChainValid() {
    return isChainValid(this.chain, this.difficulty);
  },

  /*
   * Actions
   */

  addBlock(block) {
    if (!isDataValid(block)) throw Error('Cannot add block with invalid data');
    if (!isBlockValid(this.lastBlock(), block, this.difficulty)) throw Error('Cannot add invalid block');

    this.chain.push(block);
    console.log('Added block to the chain ', block);
  },

  updateChain(newChain) {
    if (newChain.length > this.chain.length && isChainValid(newChain, this.difficulty)) {
      this.chain = newChain;
      return true;
    }

    return false;
  },

  addPeer(peer) {
    this.peers.push(peer);
  },
};

module.exports = store;
