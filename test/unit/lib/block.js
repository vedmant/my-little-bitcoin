const expect = require('chai').expect
const {generateKeyPair} = require('../../../src/lib/wallet')
const {checkBlock, makeGenesisBlock, createBlock} = require('../../../src/lib/block')
const {BlockError} = require('../../../src/errors')

describe('block lib', () => {

  const wallet = generateKeyPair()
  const genesisBlock = makeGenesisBlock()
  const validBlock = createBlock([], genesisBlock, wallet.public)

  it('it should check if block is valid', (done) => {
    checkBlock(genesisBlock, validBlock, Number.MAX_SAFE_INTEGER, [])
    done()
  })

  describe('block data validation', () => {
    let invalidBlock;
    beforeEach(() => {
      invalidBlock = JSON.parse(JSON.stringify(validBlock))
    })

    function expectCheckBlockToThrow () {
      expect(() => {
        checkBlock(genesisBlock, invalidBlock, Number.MAX_SAFE_INTEGER, [])
      }).to.throw(BlockError)
    }

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

})
