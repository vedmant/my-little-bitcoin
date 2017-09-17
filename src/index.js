const store = require('./store');
const {mineBlock} = require('./util/block');
const co = require('co');
require('./server');

co(function* () {
  while (true) {
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
  }
});
