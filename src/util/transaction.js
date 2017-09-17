const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const Joi = require('joi');
const bitcoin = require('bitcoinjs-lib');
const wallet = require('./wallet');

const transactionSchema = Joi.object().keys({
  id: Joi.string().hex().length(64),
  hash: Joi.string().hex().length(64),
  reward: Joi.boolean(),
  inputs: Joi.array().items(Joi.object().keys({
    transaction: Joi.string().hex().length(64),
    amount: Joi.number(),
    address: Joi.string().hex().length(64),
    signature: Joi.string().hex().length(64),
  })),
  outputs: Joi.array().items(Joi.object().keys({
    amount: Joi.number(),
    address: Joi.string().hex().length(64),
  })),
});

function isDataValid(transaction) {
  return Joi.validate(transaction, transactionSchema);
}

function areTransactionsValid(transactions) {
  try {
    transactions.forEach(tx => checkTransaction(tx));
    if (transactions.filter(tx => tx.reward).length !== 1) throw Error('Transactions must have exactly one reward transaction');
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
}

function checkTransaction(transaction) {
  if (transaction.hash !== calculateHash(transaction)) throw Error('Invalid transaction hash');

  // Verify each input signature
  transaction.inputs.forEach(function (input) {
    if (!verifyInputSignature(input)) throw Error('Invalid input signature');
  });

  // Check if total output amount equals input amount
  if (!transaction.reward) {
    if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0)
      !== transaction.outputs.reduce((acc, output) => acc + output.amount, 0))
      throw Error('Input and output amounts dont match');
  }
}

function verifyInputSignature(input) {
  return wallet.verifySignature(input.address, input.signature, calculateInputHash(input));
}

function calculateInputHash({transaction, amount, address}) {
  return CryptoJS.SHA256(JSON.stringify({transaction, amount, address})).toString();
}

function calculateHash({id, type, inputs, outputs}) {
  return CryptoJS.SHA256(JSON.stringify({id, type, inputs, outputs})).toString();
}

function createTransaction(inputs, outputs, reward = false) {
  const tx = {
    id: crypto.randomBytes(32).toString('hex'),
    reward,
    inputs,
    outputs,
  };
  tx.hash = calculateHash(tx);

  return tx;
}

function createInput(transaction, amount, secretKey) {
  return {
    transaction,
    amount,
    address,
  };
}

module.exports = {transactionSchema, isDataValid, areTransactionsValid, createTransaction};
