const store = require('./store');
const {makeBlock, mineBlock} = require('./util/block');
const app = require('./server');
const co = require('co');

co(function* () {
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
});

console.log(store.chain);

console.log(store.isChainValid());
