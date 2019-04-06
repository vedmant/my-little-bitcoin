import {expect} from 'chai'
import {generateKeyPair} from '../../../src/lib/wallet'
import {checkBlock, makeGenesisBlock, createBlock, calculateHash} from '../../../src/lib/block'
import {BlockError} from '../../../src/errors'

describe('block lib', () => {

  const genesisBlock = makeGenesisBlock()
  let validBlock;
  let invalidBlock;
  let wallet;

  beforeEach(() => {
    wallet = generateKeyPair()
    validBlock = createBlock([], genesisBlock, wallet)
    invalidBlock = createBlock([], genesisBlock, wallet)
  })

  it('should create valid block', (done) => {
    checkBlock(genesisBlock, validBlock, Number.MAX_SAFE_INTEGER, [])
    done()
  })

  describe('block data validation', () => {

    it('should fail on invalid index', (done) => {
      invalidBlock.index = 'test';
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on invalid prevHash', (done) => {
      invalidBlock.prevHash = 'invalid hash';
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on invalid time', (done) => {
      invalidBlock.time = 'invalid time';
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on invalid time', (done) => {
      invalidBlock.time = 'invalid time';
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on invalid nonce', (done) => {
      invalidBlock.nonce = 'invalid nonce';
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on invalid hash', (done) => {
      invalidBlock.hash = 'invalid hash';
      expectCheckBlockToThrow()
      done()
    })
  })

  describe('block verification', () => {

    it('should fail on incorrect index', (done) => {
      invalidBlock.index = 5
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on incorrect block prevHash', (done) => {
      invalidBlock.prevHash = calculateHash(invalidBlock)
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on incorrect block hash', (done) => {
      invalidBlock.nonce = 100
      expectCheckBlockToThrow()
      done()
    })

    it('should fail on incorrect difficulty', (done) => {
      expectCheckBlockToThrow(100)
      done()
    })

  })


  /* ========================================================================= *\
   * Helpers
  \* ========================================================================= */

  function expectCheckBlockToThrow (difficulty = Number.MAX_SAFE_INTEGER) {
    expect(() => {
      checkBlock(genesisBlock, invalidBlock, difficulty, [])
    }).to.throw(BlockError)
  }

})
