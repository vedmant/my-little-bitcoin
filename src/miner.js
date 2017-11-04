const debug = require('debug')('app:miner')
const Worker = require('tiny-worker')
const bus = require('./bus')
const {calculateHash, createBlock} = require('./lib/block')
const co = require('co')
const store = require('./store')
const {BlockError, TransactionError} = require('./errors')
const config = require('./config')

/**
 * Start mining
 */
function mine (wallet) {
  if (! store.mining) return

  co(function* () {
    while (store.mining) {
      const block = yield mineBlock(store.getTransactionsForNextBlock(), store.lastBlock(), store.difficulty, wallet.public)
      if (! block) {
        // Someone mined block first, started mining new one
        continue
      }
      try {
        store.addBlock(block)
        bus.emit('block-added-by-me', block)
        bus.emit('balance-updated', {public: wallet.public, balance: store.getBalanceForAddress(wallet.public)})
      } catch (e) {
        if (! (e instanceof BlockError) && ! (e instanceof TransactionError)) throw e
        console.error(e)
      }
    }
  }).catch(e => console.error(e))
}

/**
 * Mine a block in separate process
 *
 * @param transactions Transactions list to add to the block
 * @param lastBlock Last block in the blockchain
 * @param difficulty Current difficulty
 * @param address Addres for reward transaction
 * @return {*}
 */
function mineBlock (transactions, lastBlock, difficulty, address) {
  const block = createBlock(transactions, lastBlock, address)
  block.hash = calculateHash(block)

  debug(`Started mining block ${block.index}`)

  return new Promise((resolve, reject) => {
    if (config.demoMode) {
      setTimeout(() => findBlockHash(block, difficulty).then(block => resolve(block)), 60 * 1000)
    } else {
      findBlockHash(block, difficulty).then(block => resolve(block))
    }
  })
}

/**
 * Find block hash according to difficulty
 *
 * @param block
 * @param difficulty
 * @return {Promise}
 */
function findBlockHash (block, difficulty) {
  return new Promise((resolve, reject) => {
    /*
     * Create worker to find hash in separate process
     */
    const worker = new Worker(function () {
      const util = require(require('path').resolve(__dirname, 'src/lib/block'))
      const debug = require('debug')('app:miner')
      self.onmessage = (e) => {
        const {block, difficulty} = e.data
        while (util.getDifficulty(block.hash) >= difficulty) {
          block.nonce++
          block.hash = util.calculateHash(block)
          if (block.nonce % 100000 === 0) debug('100K hashes')
        }
        postMessage({type: 'block', block})
        self.close()
      }
    })
    worker.onmessage = (e) => {
      removeListeners()
      resolve(e.data.block)
    }
    worker.postMessage({block, difficulty})

    /*
     * Hadnle events to stop mining when needed
     */
    const mineStop = () => {
      removeListeners()
      resolve(null)
      debug('kill thread')
      worker.terminate()
    }
    // Listeners for stopping mining
    const blockAddedListener = b => { if (b.index >= block.index) mineStop() }
    const mineStopListener = b => mineStop
    const removeListeners = () => {
      bus.removeListener('block-added', blockAddedListener)
      bus.removeListener('mine-stop', mineStopListener)
    }
    // If other process found the same block faster, kill current one
    bus.once('block-added', blockAddedListener)
    bus.once('mine-stop', mineStopListener)
  })
}

module.exports = {mine, mineBlock}
