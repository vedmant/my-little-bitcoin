import store from './store';
import {makeBlock, mineBlock} from './util/block';
import app from './server';
import co from 'co';

co(function* () {
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
});

console.log(store.chain);

console.log(store.isChainValid());
