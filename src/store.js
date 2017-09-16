import {loadChain, saveChain, isChainValid} from './util/chain'
import {isDataValid, isBlockValid} from './util/block'

const store = {
    difficulty: 5,

    chain: loadChain(),

    mempool: [{hash: 123, from: 123, to: 123, amount: 1}],

    peers: [],

    lastBlock () {
        return this.chain[this.chain.length - 1];
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

// process.stdin.resume(); // so the program will not close instantly
// function exitHandler(options, err) {
//     saveChain(store.chain);
//     console.log('Saving Chain \n');
//     if (err) console.error(err.stack);
//     process.exit();
// }
// process.on('exit', exitHandler.bind(null)); //do something when app is closing
// process.on('SIGINT', exitHandler.bind(null)); // catches ctrl+c event
// process.on('uncaughtException', exitHandler.bind(null)); // catches uncaught exceptions

export default store;