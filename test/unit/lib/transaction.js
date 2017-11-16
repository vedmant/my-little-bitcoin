const expect = require('chai').expect
const {generateKeyPair} = require('../../../src/lib/wallet')
const {checkTransactions, checkTransaction, createRewardTransaction, buildTransaction} = require('../../../src/lib/transaction')
const {TransactionError} = require('../../../src/errors')

describe('block lib', () => {

  let validTransaction;
  let invalidTransaction;
  let wallet1;
  let wallet2;
  let unspent;

  beforeEach(() => {
    wallet1 = generateKeyPair()
    wallet2 = generateKeyPair()
    unspent = [
      [{index: 0, amount: 50, address: wallet1.puclic}],
      [{index: 0, amount: 50, address: wallet1.puclic}],
    ]
    validTransaction = buildTransaction(wallet1, wallet2.public, 100, unspent)
    invalidTransaction = buildTransaction(wallet1, wallet2.public, 100, unspent)
  })

  describe('transaction data validation', () => {

    it('should fail on invalid id', (done) => {
      invalidTransaction.id = 'test';
      expectCheckTransactionToThrow()
      done()
    })

  })


  /* ========================================================================= *\
   * Helpers
  \* ========================================================================= */

  function expectCheckTransactionToThrow () {
    expect(() => {
      checkTransaction(invalidTransaction, unspent)
    }).to.throw(TransactionError)
  }

})
