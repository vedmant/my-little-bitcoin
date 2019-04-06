import {expect} from 'chai'
import crypto from 'crypto'
import {miningReward} from '../../../src/config'
import {generateKeyPair} from '../../../src/lib/wallet'
import blockLib from '../../../src/lib/block'
import walletLib from '../../../src/lib/wallet'
import {isDataValid, checkTransactions, checkTransaction, calculateHash, createRewardTransaction, buildTransaction} from '../../../src/lib/transaction'
import {TransactionError} from '../../../src/errors'

describe('transaction lib', () => {

  const wallet1 = generateKeyPair()
  const wallet2 = generateKeyPair()

  // Create simple chain with three blocks
  const chain = [blockLib.makeGenesisBlock()];

  for (let i = 0; i < 2; i++) {
    let block = blockLib.createBlock([], chain[chain.length - 1], wallet1)
    block.hash = blockLib.calculateHash(block)
    chain.push(block)
  }

  const unspent = chain
    // Get all transactions from the chain
    .reduce((transactions, block) => transactions.concat(block.transactions), [])
    // Get all outputs from transactions and append tx id
    .reduce((outputs, tx) => outputs.concat(tx.outputs.map(o => Object.assign({}, o, {tx: tx.id}))), [])

  let tx
  let rewardTx

  beforeEach(() => {
    tx = buildTransaction(wallet1, wallet2.public, 100, unspent)
    rewardTx = createRewardTransaction(wallet1)
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

  describe('block transactions list verification', () => {

    it('should fail if has more than one reward transactoins', (done) => {
      const rewardTx2 = createRewardTransaction(wallet1)
      const transactions = [tx, rewardTx, rewardTx2]

      expect(() => {
        checkTransactions(transactions, unspent)
      }).to.throw(TransactionError, 'Transactions must have exactly one reward transaction')
      done()
    })

  })


  describe('transaction verification', () => {

    it('should fail on invalid hash', (done) => {
      tx.hash = calculateHash(Object.assign({}, tx, {id: crypto.randomBytes(32).toString('hex')}))
      expectCheckTransactionToThrow(tx)
      done()
    })

    it('should fail on invalid signature', (done) => {
      tx.signature = crypto.randomBytes(64).toString('base64')
      expectCheckTransactionToThrow(tx, 'Invalid transaction signature')
      done()
    })

    it('should fail if some if inputs don\'t match transaction address', (done) => {
      tx.address = wallet2.public
      tx.hash = calculateHash(tx)
      tx.signature = walletLib.signHash(wallet2.private, tx.hash)
      expectCheckTransactionToThrow(tx, 'Transaction and input addresses dont match')
      done()
    })

    it('should fail on invalid input signature', (done) => {
      tx.inputs[0].signature = crypto.randomBytes(64).toString('base64')
      tx.hash = calculateHash(tx)
      tx.signature = walletLib.signHash(wallet1.private, tx.hash)
      expectCheckTransactionToThrow(tx, 'Invalid input signature')
      done()
    })

    it('should fail on invalid reward output amount', (done) => {
      rewardTx.outputs[0].amount = 200
      rewardTx.hash = calculateHash(rewardTx)
      rewardTx.signature = walletLib.signHash(wallet1.private, rewardTx.hash)
      expectCheckTransactionToThrow(rewardTx, `Mining reward must be exactly: ${miningReward}`)
      done()
    })

    it('should fail on invalid reward outputs number', (done) => {
      rewardTx.outputs[1] = Object.assign({}, rewardTx.outputs[0])
      rewardTx.hash = calculateHash(rewardTx)
      rewardTx.signature = walletLib.signHash(wallet1.private, rewardTx.hash)
      expectCheckTransactionToThrow(rewardTx, 'Reward transaction must have exactly one output')
      done()
    })

    it('should fail on not matching inputs and outputs amounts', (done) => {
      tx.outputs[0].amount = 200
      tx.hash = calculateHash(tx)
      tx.signature = walletLib.signHash(wallet1.private, tx.hash)
      expectCheckTransactionToThrow(tx, 'Input and output amounts do not match')
      done()
    })

  })


  /* ========================================================================= *\
   * Helpers
  \* ========================================================================= */

  function expectCheckTransactionToThrow (transaction, message) {
    expect(() => {
      checkTransaction(transaction, unspent)
    }).to.throw(TransactionError, message)
  }

})
