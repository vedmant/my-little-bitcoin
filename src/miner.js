const {spawn} = require('threads');
const {createRewardTransaction} = require('./lib/transaction');
const bus = require('./bus');
const {calculateHash} = require('./lib/block');

/**
 * Mine a block in separate process
 *
 * @param transactions Transactions list to add to the block
 * @param lastBlock Last block in the blockchain
 * @param difficulty Current difficulty
 * @param address Addres for reward transaction
 * @return {*}
 */
function mineBlock(transactions, lastBlock, difficulty, address) {
  transactions = transactions.slice();
  transactions.push(createRewardTransaction(address));
  const block = {
    index: lastBlock.index + 1,
    prevHash: lastBlock.hash,
    timestamp: Math.floor(new Date().getTime() / 1000),
    transactions,
    nonce: 0,
  };
  block.hash = calculateHash(block);

  console.log(`Started mining block ${block.index}`);
  return new Promise((resolve, reject) => {
    // Listeners for stopping mining
    const blockAddedListener = b => {
      if (b.index >= block.index) {
        console.log('kill thread')
        removeListeners();
        resolve(null);
        thread.kill()
      }
    };
    const mineStopListener = b => thread.kill();
    const removeListeners = () => {
      bus.removeListener('block-added', blockAddedListener);
      bus.removeListener('mine-stop', mineStopListener);
    };

    // Use separate thread to not to block main thread
    const thread = spawn(function ({block, difficulty, __dirname}, done, progress) {
      const util = require(__dirname + '/lib/block');
      while (util.getDifficulty(block.hash) >= difficulty) {
        block.nonce++;
        block.hash = util.calculateHash(block);
        if (block.nonce % 100000 === 0) progress('100K hashes');
      }
      done(block);
    })
      .send({block, difficulty, __dirname})
      .on('progress', progress => console.log(progress))
      .on('message', block => {
        removeListeners();
        resolve(block);
      });

    // (to test) If other process found the same block faster, kill current one
    bus.once('block-added', blockAddedListener);
    bus.once('mine-stop', mineStopListener);
  }).then(block => {
    return block;
  });
}


module.exports = {mineBlock};
