const co = require('co');
const {mineBlock} = require('./lib/block');
const store = require('./store');

require('./server');
require('./socket');

// co(function* () {
//   store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty, store.wallet.public));
// }).catch(e => console.log(e));
