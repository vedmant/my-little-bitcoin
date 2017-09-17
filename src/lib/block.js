const {BlockError} = require('../errors');
const CryptoJS = require('crypto-js');
const Joi = require('joi');
const {spawn} = require('threads');
const {checkTransactions} = require('./transaction');

const blockSchema = Joi.object().keys({
  index: Joi.number(),
  prevHash: Joi.string().hex().length(64),
  time: Joi.number(),
  transactions: Joi.array(),
  nonce: Joi.number(),
  hash: Joi.string().hex().length(64),
});

function isDataValid(block) {
  return Joi.validate(block, blockSchema);
}

function checkBlock(previousBlock, block, difficulty) {
  if (! isDataValid(block)) throw new BlockError('Invalid block data');
  const blockDifficulty = getDifficulty(block.hash);
  if (previousBlock.index + 1 !== block.index) throw new BlockError('Invalid block index');
  if (previousBlock.hash !== block.prevHash) throw new BlockError('Invalid block prevhash');
  if (calculateHash(block) !== block.hash) throw new BlockError('Invalid block hash');
  if (blockDifficulty > difficulty) throw new BlockError('Invalid block difficulty');
  checkTransactions(block.transactions);
}

function calculateHash({index, prevHash, timestamp, transactions, nonce}) {
  return CryptoJS.SHA256(JSON.stringify({index, prevHash, timestamp, transactions, nonce})).toString();
}

function makeGenesisBlock() {
  const block = {
    index: 0,
    prevHash: '0',
    timestamp: Math.floor(new Date().getTime() / 1000),
    transactions: [],
    nonce: 0,
  };
  block.hash = calculateHash(block);

  return block;
}

function getDifficulty(hash) {
  return parseInt(hash.substring(0, 8), 16);
}

function mineBlock(transactions, lastBlock, difficulty) {
  const block = {
    index: lastBlock.index + 1,
    prevHash: lastBlock.hash,
    timestamp: Math.floor(new Date().getTime() / 1000),
    transactions,
    nonce: 0,
  };
  block.hash = calculateHash(block);

  // Use separate thread to not to block main thread
  return spawn(function ({block, difficulty, __dirname}, done, progress) {
    const util = require(__dirname + '/block');
    while (util.getDifficulty(block.hash) >= difficulty) {
      block.nonce++;
      block.hash = util.calculateHash(block);
      if (block.nonce % 100000 === 0) progress('100K hashes');
    }
    done(block);
  })
    .send({block, difficulty, __dirname})
    .on('progress', progress => console.log(progress))
    .promise();
}

module.exports = {checkBlock, calculateHash, makeGenesisBlock, getDifficulty, mineBlock};
