const store = require('./store');
const {mineBlock} = require('./lib/block');
const {createRewardTransaction} = require('./lib/transaction');
const co = require('co');
require('./server');

co(function* () {
  while (true) {
    store.addTransaction(createRewardTransaction(store.wallet));
    store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    console.log('My balance:' + store.getBalanceForAddress(store.wallet.public));
  }
}).catch(e => console.log(e));
