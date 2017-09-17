const {loadChain, saveChain, isChainValid} = require('./util/chain');
const {isDataValid, isBlockValid, makeGenesisBlock} = require('./util/block');
const {generateKeyPair} = require('./util/wallet');

const store = {
    difficulty: 10000, // The less value the bigger difficulty

    chain: [makeGenesisBlock()],

    mempool: [],

    peers: [],

    wallet: generateKeyPair(),

    lastBlock () {
        return this.chain[this.chain.length - 1];
    },

    blocksAfter (index) {
        if (index >= this.chain.length) return [];
        return this.chain.slice(index);
    },

    addBlock (block) {
        if (! isDataValid(block)) throw Error('Cannot add block with invalid data');
        if (! isBlockValid(this.lastBlock(), block, this.difficulty)) throw Error('Cannot add invalid block');

        this.chain.push(block);
        console.log('Added block to the chain ', block);
    },

    isChainValid () {
        return isChainValid(this.chain, this.difficulty);
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
}

module.exports = store;
