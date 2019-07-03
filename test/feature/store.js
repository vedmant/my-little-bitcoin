import {expect} from 'chai'
import {calculateHash, createBlock} from '../../src/lib/block'
import {createRewardTransaction} from '../../src/lib/transaction'
import co from 'co'
import config from '../../src/config'
import bus from '../../src/bus'
import storeFactory from '../../src/store'
import minerFactory from '../../src/miner'
import {BlockError, TransactionError} from '../../src/errors'

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
      block = yield miner.findBlockHash(block, store.difficulty)
      store.addBlock(block)
      expect(store.chain.length).to.equal(2)
    })
  })

  it('should not add block with invalid hash', () => {
    return co(function *() {
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block.hash = calculateHash(block)
      block.hash = block.hash.slice(0, -4) + '0000'

      expect(() => store.addBlock(block)).to.throw(BlockError, 'Invalid block hash')
    })
  })

  it('should not add block with wrong hash difficulty', () => {
    return co(function *() {
      store.difficulty = 10000
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block.hash = calculateHash(block)

      expect(() => store.addBlock(block)).to.throw(BlockError, 'Invalid block difficulty')
    })
  })

  it('should not add block with invalid prev hash', () => {
    return co(function *() {
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block = yield miner.findBlockHash(block, store.difficulty)
      block.prevHash = calculateHash(block)

      expect(() => store.addBlock(block)).to.throw(BlockError, 'Invalid block prevhash')
    })
  })

  it('should not add block with invalid prev hash', () => {
    return co(function *() {
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block = yield miner.findBlockHash(block, store.difficulty)
      block.index = 5

      expect(() => store.addBlock(block)).to.throw(BlockError, 'Invalid block index')
    })
  })

  it('should not add block with invalid prev hash', () => {
    return co(function *() {
      let block = createBlock([], store.lastBlock(), store.wallets[0])
      block = yield miner.findBlockHash(block, store.difficulty)
      block.index = 5

      expect(() => store.addBlock(block)).to.throw(BlockError, 'Invalid block index')
    })
  })

  it('should not add block with two reward transactions', () => {
    return co(function *() {
      let block = createBlock([createRewardTransaction(store.wallets[0])], store.lastBlock(), store.wallets[0])
      block = yield miner.findBlockHash(block, store.difficulty)

      expect(() => store.addBlock(block)).to.throw(TransactionError, 'Transactions must have exactly one reward transaction')
    })
  })

  it.skip('should not add block with invalid transaction hash', () => {

  })

  it.skip('should not add block with invalid transaction signature', () => {

  })

  it.skip('should not add block if transaction and input addresses dont match', () => {

  })

  it.skip('should not add block with transactions with invalid input signature', () => {

  })

  it.skip('should not add block with transactions that have already spent input', () => {

  })

  it.skip('should not add block with reward transactions with more than one output', () => {

  })

  it.skip('should not add block with wrong mining reward', () => {

  })

  it.skip('should not add block with transactions where input and output amounts do not match', () => {

  })
})
