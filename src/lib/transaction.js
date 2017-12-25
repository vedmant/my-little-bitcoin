const {TransactionError} = require('../errors')
const CryptoJS = require('crypto-js')
const crypto = require('crypto')
const Joi = require('joi')
const walletLib = require('./wallet')
const {miningReward} = require('../config')

const transactionSchema = Joi.object().keys({
  id: Joi.string().hex().length(64),
  time: Joi.number(),
  hash: Joi.string().hex().length(64),
  reward: Joi.boolean(),
  inputs: Joi.array().items(Joi.object().keys({
    tx: Joi.string().hex().length(64),
    index: Joi.number(),
    amount: Joi.number(),
    address: Joi.string(),
    signature: Joi.string().base64(),
  })),
  outputs: Joi.array().items(Joi.object().keys({
    index: Joi.number(),
    amount: Joi.number(),
    address: Joi.string(),
  })),
})

/**
 * Validate transaction data
 *
 * @param transaction
 * @return {*}
 */
function isDataValid (transaction) {
  return Joi.validate(transaction, transactionSchema).error === null
}

/**
 * Verify block transactions list
 *
 * @param transactions
 * @param unspent
 */
function checkTransactions (transactions, unspent) {
  transactions.forEach(tx => checkTransaction(tx, unspent))
  if (transactions.filter(tx => tx.reward).length !== 1) throw new TransactionError('Transactions must have exactly one reward transaction')
}

/**
 * Verify single transaction
 *
 * @param transaction
 * @param unspent
 */
function checkTransaction (transaction, unspent) {
  if (! isDataValid(transaction)) throw new TransactionError('Transaction data is not valid')
  if (transaction.hash !== calculateHash(transaction)) throw new TransactionError('Invalid transaction hash')

  // Verify each input signature
  transaction.inputs.forEach(function (input) {
    if (! verifyInputSignature(input)) throw new TransactionError('Invalid input signature')
  })

  // Check if inputs are in unspent list
  transaction.inputs.forEach(function (input) {
    if (! unspent.find(out => out.tx === input.tx && out.index === input.index)) { throw new TransactionError('Input has been already spent: ' + input.tx) }
  })

  if (transaction.reward) {
    // For reward transaction: check if reward output is correct
    if (transaction.outputs.length !== 1) throw new TransactionError('Reward transaction must have exactly one output')
    if (transaction.outputs[0].amount !== miningReward) throw new TransactionError(`Mining reward must be exactly: ${miningReward}`)
  } else {
    // For normal transaction: check if total output amount equals input amount
    if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0) !==
      transaction.outputs.reduce((acc, output) => acc + output.amount, 0)) { throw new TransactionError('Input and output amounts do not match') }
  }

  return true
}

/**
 * Verify input signature
 *
 * @param input
 * @return {*}
 */
function verifyInputSignature (input) {
  return walletLib.verifySignature(input.address, input.signature, calculateInputHash(input))
}

/**
 * Calculate transaction hash
 *
 * @param transaction
 */
function calculateHash ({id, type, inputs, outputs}) {
  return CryptoJS.SHA256(JSON.stringify({id, type, inputs, outputs})).toString()
}

/**
 * Calculate input hash
 *
 * @param input
 */
function calculateInputHash ({tx, index, amount, address}) {
  return CryptoJS.SHA256(JSON.stringify({tx, index, amount, address})).toString()
}

/**
 * Create transaction
 *
 * @param inputs
 * @param outputs
 * @param reward
 * @return {{id: string, reward: boolean, inputs: *, outputs: *, hash: string}}
 */
function createTransaction (inputs, outputs, reward = false) {
  const tx = {
    id: crypto.randomBytes(32).toString('hex'),
    time: Math.floor(new Date().getTime() / 1000),
    reward,
    inputs,
    outputs,
  }
  tx.hash = calculateHash(tx)

  return tx
}

/**
 * Create reward transaction for block mining
 *
 * @param address
 * @return {{id: string, reward: boolean, inputs: *, outputs: *, hash: string}}
 */
function createRewardTransaction (address) {
  return createTransaction([], [{index: 0, amount: miningReward, address}], true)
}

/**
 * Create and sign input
 *
 * @param tx Based on transaction id
 * @param index Based on transaction output index
 * @param amount
 * @param wallet
 * @return {{tx: *, index: *, amount: *, address: *}}
 */
function createInput (tx, index, amount, wallet) {
  const input = {
    tx,
    index,
    amount,
    address: wallet.public,
  }
  input.signature = walletLib.signHash(wallet.private, calculateInputHash(input))

  return input
}

/**
 * Build a transaction to send money
 *
 * @param wallet
 * @param toAddress
 * @param amount
 * @param unspent
 * @return {{id: string, reward: boolean, inputs: *, outputs: *, hash: string}}
 */
function buildTransaction (wallet, toAddress, amount, unspent) {
  let inputsAmount = 0
  const inputsRaw = unspent.filter(i => {
    const more = inputsAmount < amount
    if (more) inputsAmount += i.amount
    return more
  })
  if (inputsAmount < amount) throw new TransactionError('Not enough funds')

  const inputs = inputsRaw.map(i => createInput(i.tx, i.index, i.amount, wallet))

  // Send amount to destination address
  const outputs = [{index: 0, amount, address: toAddress}]
  // Send back change to my wallet
  if (inputsAmount - amount > 0) {
    outputs.push({index: 1, amount: inputsAmount - amount, address: wallet.public})
  }

  return createTransaction(inputs, outputs)
}

module.exports = {
  isDataValid,
  checkTransactions,
  checkTransaction,
  calculateHash,
  createRewardTransaction,
  buildTransaction,
}
