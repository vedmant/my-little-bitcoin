import {calculateHash, createBlock} from '../../src/lib/block'
import co from 'co'
import config from '../../src/config'
import bus from '../../src/bus'
import storeFactory from '../../src/store'
import minerFactory from '../../src/miner'

describe('store', () => {

  let store
  let miner

  beforeEach(() => {
    store = storeFactory(config, bus)
    miner = minerFactory(config, bus, store)
    store.difficulty = 1000000000
  })

  it('should add valid block', () => {
    return co(function *() {
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block.hash = calculateHash(block)
      block = yield miner.findBlockHash(block, store.difficulty)
      store.addBlock(block)

    })
  })
})
