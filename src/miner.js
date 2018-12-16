const debug = require('debug')('app:miner')
const Worker = require('tiny-worker')
const { calculateHash, createBlock } = require('./lib/block')
const co = require('co')
const { BlockError, TransactionError } = require('./errors')

module.exports = (config, bus, store) => ({

  /**
   * Start mining
   *
   * @param wallet Wallet for reward transaction
   */
  mine (wallet) {
    if (! store.mining) return

    co(function* () {
      while (store.mining) {
        const block = yield this.mineBlock(store.getTransactionsForNextBlock(), store.lastBlock(), store.difficulty, wallet)
        if (! block) {
          // Someone mined block first or new transaction was added, start mining new one
          continue
        }
        try {
          store.addBlock(block)
          bus.emit('block-added-by-me', block)
          bus.emit('balance-updated', { public: wallet.public, balance: store.getBalanceForAddress(wallet.public) })
        } catch (e) {
          if (! (e instanceof BlockError) && ! (e instanceof TransactionError)) throw e
          console.error(e)
        }
      }
    }.bind(this)).catch(e => console.error(e))
  },

  /**
   * Mine a block in separate process
   *
   * @param transactions Transactions list to add to the block
   * @param lastBlock Last block in the blockchain
   * @param difficulty Current difficulty
   * @param wallet Wallet for reward transaction
   * @return {*}
   */
  mineBlock (transactions, lastBlock, difficulty, wallet) {
    const block = createBlock(transactions, lastBlock, wallet)
    block.hash = calculateHash(block)

    debug(`Started mining block ${block.index}`)

    return new Promise((resolve, reject) => {
      if (config.demoMode) {
        setTimeout(() => this.findBlockHash(block, difficulty).then(block => resolve(block)), 60 * 1000)
      } else {
        this.findBlockHash(block, difficulty).then(block => resolve(block))
      }
    })
  },

  /**
   * Find block hash according to difficulty
   *
   * @param block
   * @param difficulty
   * @return {Promise}
   */
  findBlockHash (block, difficulty) {
    return new Promise((resolve, reject) => {
      /*
      * Create worker to find hash in separate process
      */
      const worker = new Worker(function () {
        const util = require(require('path').resolve(process.cwd(), 'src/lib/block'))
        const debug = require('debug')('app:miner')
        self.onmessage = e => {
          const { block, difficulty } = e.data
          while (util.getDifficulty(block.hash) >= difficulty) {
            block.nonce++
            block.hash = util.calculateHash(block)
            if (block.nonce % 100000 === 0) debug('100K hashes')
          }
          postMessage({ type: 'block', block })
          self.close()
        }
      })
      worker.onmessage = e => {
        removeListeners()
        resolve(e.data.block)
      }
      worker.postMessage({ block, difficulty })

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
      const blockAddedListener = b => {
        if (b.index >= block.index) mineStop()
      }
      const mineStopListener = b => mineStop()

      const removeListeners = () => {
        bus.removeListener('block-added', blockAddedListener)
        bus.removeListener('mine-stop', mineStopListener)
        bus.removeListener('transaction-added', mineStopListener)
        bus.removeListener('transaction-added-by-me', mineStopListener)
      }
      // If other process found the same block faster, kill current one
      bus.once('block-added', blockAddedListener)
      bus.once('mine-stop', mineStopListener)
      bus.once('transaction-added', mineStopListener)
      bus.once('transaction-added-by-me', mineStopListener)
    })
  },

})
