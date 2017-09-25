const {BlockError} = require('../errors')
const CryptoJS = require('crypto-js')
const Joi = require('joi')
const {checkTransactions, createRewardTransaction} = require('./transaction')

const blockSchema = Joi.object().keys({
  index: Joi.number(),
  prevHash: Joi.string().hex().length(64),
  time: Joi.number(),
  transactions: Joi.array(),
  nonce: Joi.number(),
  hash: Joi.string().hex().length(64),
})

/**
 * Validate block data
 *
 * @param block
 * @return {*}
 */
function isDataValid (block) {
  return Joi.validate(block, blockSchema).error === null
}

/**
 * Verify block
 *
 * @param previousBlock
 * @param block
 * @param difficulty
 * @param unspent
 */
function checkBlock (previousBlock, block, difficulty, unspent) {
  if (! isDataValid(block)) throw new BlockError('Invalid block data')
  const blockDifficulty = getDifficulty(block.hash)
  if (previousBlock.index + 1 !== block.index) throw new BlockError('Invalid block index')
  if (previousBlock.hash !== block.prevHash) throw new BlockError('Invalid block prevhash')
  if (calculateHash(block) !== block.hash) throw new BlockError('Invalid block hash')
  if (blockDifficulty > difficulty) throw new BlockError('Invalid block difficulty')
  checkTransactions(block.transactions, unspent)
}

/**
 * Generate block hash
 *
 * @param block
 */
function calculateHash ({index, prevHash, time, transactions, nonce}) {
  return CryptoJS.SHA256(JSON.stringify({index, prevHash, time, transactions, nonce})).toString()
}

/**
 * Create genesis block
 *
 * @return {{index: number, prevHash: string, time: number, transactions: Array, nonce: number}}
 */
function makeGenesisBlock () {
  const block = {
    index: 0,
    prevHash: '0',
    time: '1505759228',
    transactions: [],
    nonce: 0,
  }
  block.hash = calculateHash(block)

  return block
}

/**
 * Create new block
 *
 * @param transactions {array}
 * @param lastBlock {object}
 * @param address {string}
 * @return {{index: *, prevHash, time: number, transactions: *, nonce: number}}
 */
function createBlock (transactions, lastBlock, address) {
  transactions = transactions.slice()
  transactions.push(createRewardTransaction(address))
  const block = {
    index: lastBlock.index + 1,
    prevHash: lastBlock.hash,
    time: Math.floor(new Date().getTime() / 1000),
    transactions,
    nonce: 0,
  }
  block.hash = calculateHash(block)

  return block
}

/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */
function getDifficulty (hash) {
  return parseInt(hash.substring(0, 8), 16)
}

module.exports = {checkBlock, calculateHash, makeGenesisBlock, createBlock, getDifficulty}
