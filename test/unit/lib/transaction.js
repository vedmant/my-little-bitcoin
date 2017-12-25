const expect = require('chai').expect
const crypto = require('crypto')
const {generateKeyPair} = require('../../../src/lib/wallet')
const blockLib = require('../../../src/lib/block')
const {isDataValid, checkTransactions, checkTransaction, calculateHash, createRewardTransaction, buildTransaction} = require('../../../src/lib/transaction')
const {TransactionError} = require('../../../src/errors')

describe('transaction lib', () => {

  const wallet1 = generateKeyPair();
  const wallet2 = generateKeyPair();

  // Create simple chain with three blocks
  const chain = [blockLib.makeGenesisBlock()];

  for (let i = 0; i < 2; i++) {
    let block = blockLib.createBlock([], chain[chain.length - 1], wallet1.public)
    block.hash = blockLib.calculateHash(block)
    chain.push(block)
  }

  const unspent = chain
    // Get all transactions from the chain
    .reduce((transactions, block) => transactions.concat(block.transactions), [])
    // Get all outputs from transactions and append tx id
    .reduce((outputs, tx) => outputs.concat(tx.outputs.map(o => Object.assign({}, o, {tx: tx.id}))), [])

  let tx;
  let rewardTx;

  beforeEach(() => {
    tx = buildTransaction(wallet1, wallet2.public, 100, unspent)
    rewardTx = createRewardTransaction(wallet1.public)
  })

  describe('transaction data validation', () => {

    it('should validate id', (done) => {
      tx.id = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate time', (done) => {
      tx.time = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate hash', (done) => {
      tx.hash = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate reward flag', (done) => {
      tx.reward = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate inputs', (done) => {
      tx.inputs = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate input data', (done) => {
      tx.inputs = [{
        tx: 'invalid',
        index: 'invalid',
        amount: 'invalid',
        address: false,
        signature: 'invalid',
      }];
      tx.hash = calculateHash(tx)
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate outputs', (done) => {
      tx.outputs = 'invalid';
      expect(isDataValid(tx)).to.be.false
      done()
    })

    it('should validate output data', (done) => {
      tx.outputs = [{
        index: 'invalid',
        amount: 'invalid',
        address: false,
      }];
      tx.hash = calculateHash(tx)
      expect(isDataValid(tx)).to.be.false
      done()
    })

  })

  describe('transaction verification', () => {

    it('should fail on invalid hash', (done) => {
      tx.hash = calculateHash(Object.assign({}, tx, {id: crypto.randomBytes(32).toString('hex')}))
      expectCheckTransactionToThrow(tx)
      done()
    })

    it('should fail on invalid input signature', (done) => {
      tx.inputs[0].signature = crypto.randomBytes(64).toString('base64')
      tx.hash = calculateHash(tx)
      expectCheckTransactionToThrow(tx)
      done()
    })

    it('should fail on invalid reward output amount', (done) => {
      rewardTx.outputs[0].amount = 200
      rewardTx.hash = calculateHash(rewardTx)
      expectCheckTransactionToThrow(rewardTx)
      done()
    })

    it('should fail on invalid reward outputs number', (done) => {
      rewardTx.outputs[1] = Object.assign({}, rewardTx.outputs[0])
      rewardTx.hash = calculateHash(rewardTx)
      expectCheckTransactionToThrow(rewardTx)
      done()
    })

    it('should fail on not matching inputs and outputs amounts', (done) => {
      tx.outputs[0].amount = 200
      tx.hash = calculateHash(tx)
      expectCheckTransactionToThrow(tx)
      done()
    })

  })


  /* ========================================================================= *\
   * Helpers
  \* ========================================================================= */

  function expectCheckTransactionToThrow (transaction) {
    expect(() => {
      checkTransaction(transaction, unspent)
    }).to.throw(TransactionError)
  }

})
