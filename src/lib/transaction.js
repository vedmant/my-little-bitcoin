const {TransactionError} = require('../errors')
const CryptoJS = require('crypto-js')
const crypto = require('crypto')
const Joi = require('joi')
const walletLib = require('./wallet')
const {miningReward} = require('../config')

const transactionSchema = Joi.object().keys({
  id: Joi.string().hex().length(64), // Transaction unique id
  time: Joi.number(), // Transaction timestamp
  reward: Joi.boolean(), // Boolean to mark mining reward transaction
  address: Joi.string(), // Transaction is limited to only one input address for simplicity
  hash: Joi.string().hex().length(64), // Transaction hash
  signature: Joi.string().base64(), // Transaction hash signature

  inputs: Joi.array().items(Joi.object().keys({
    tx: Joi.string().hex().length(64), // Points to transaction of referenced output
    index: Joi.number(), // Index of the output in the referenced transaction
    amount: Joi.number(), // Amount of the referenced output
    address: Joi.string(), // Address (public key) of the referenced output
    signature: Joi.string().base64(), // Signature, signed by private key and can be verified by included public key
  })),

  outputs: Joi.array().items(Joi.object().keys({
    index: Joi.number(), // Output index in current transaction
    amount: Joi.number(), // Amount of the output
    address: Joi.string(), // Address (public key) of the wallet where to transfer funds
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
  if (! verifyTransactionSignature(transaction)) throw new TransactionError('Invalid transaction signature')

  // Verify that all transaction's inputs addresses match transaction address, this is to ensure
  // that whole transaction is genuine and node did not replace any of transaction outputs
  if (! transaction.inputs.every(i => i.address === transaction.address)) throw new TransactionError('Transaction and input addresses dont match')

  // Verify each input signature
  transaction.inputs.forEach(function (input) {
    if (! verifyInputSignature(input)) throw new TransactionError('Invalid input signature')
  })

  // Check if inputs are in unspent list
  transaction.inputs.forEach(function (input) {
    if (! unspent.find(out => out.tx === input.tx && out.index === input.index && out.amount === input.amount && out.address === input.address)) {
      throw new TransactionError('Input has been already spent: ' + input.tx)
    }
  })

  if (transaction.reward) {
    // For reward transaction: check if reward output is correct
    if (transaction.outputs.length !== 1) throw new TransactionError('Reward transaction must have exactly one output')
    if (transaction.outputs[0].amount !== miningReward) throw new TransactionError(`Mining reward must be exactly: ${miningReward}`)
  } else {
    // For normal transaction: check if total output amount equals input amount
    if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0) !== transaction.outputs.reduce((acc, output) => acc + output.amount, 0)) {
      throw new TransactionError('Input and output amounts do not match')
    }
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
 * Verify transaction signature
 *
 * @param transaction
 * @return {*}
 */
function verifyTransactionSignature (transaction) {
  return walletLib.verifySignature(transaction.address, transaction.signature, transaction.hash)
}

/**
 * Calculate transaction hash
 *
 * @param transaction
 */
function calculateHash ({id, time, address, reward, inputs, outputs}) {
  return CryptoJS.SHA256(JSON.stringify({id, time, address, reward, inputs, outputs})).toString()
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
 * Create and sign input
 *
 * @param tx Based on transaction id
 * @param index Based on transaction output index
 * @param amount
 * @param wallet
 * @return {{tx: string, index: number, amount: number, address: string}}
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
 * Create transaction from inputs and outputs
 *
 * @param {{public: string, private: string}} wallet
 * @param {Array} inputs
 * @param {Array} outputs
 * @param {boolean} reward
 * @return {{id: string, reward: boolean, inputs: Array, outputs: Array, hash: string}}
 */
function createTransaction (wallet, inputs, outputs, reward = false) {
  const tx = {
    id: crypto.randomBytes(32).toString('hex'),
    time: Math.floor(new Date().getTime() / 1000),
    reward,
    inputs,
    outputs,
  }
  tx.address = wallet.public
  tx.hash = calculateHash(tx)
  tx.signature = walletLib.signHash(wallet.private, tx.hash)

  return tx
}

/**
 * Create reward transaction for block mining
 *
 * @param {{public: string, private: string}} wallet
 * @return {{id: string, reward: boolean, inputs: Array, outputs: Array, hash: string}}
 */
function createRewardTransaction (wallet) {
  return createTransaction(wallet, [], [{index: 0, amount: miningReward, address: wallet.public}], true)
}

/**
 * Build a transaction for sending money
 *
 * @param {{public: string, private: string}} wallet
 * @param {string} toAddress
 * @param {Number} amount
 * @param {Array} unspent
 * @return {{id: string, reward: boolean, inputs: Array, outputs: Array, hash: string}}
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

  return createTransaction(wallet, inputs, outputs)
}

module.exports = {
  isDataValid,
  checkTransactions,
  checkTransaction,
  calculateHash,
  createRewardTransaction,
  buildTransaction,
}
