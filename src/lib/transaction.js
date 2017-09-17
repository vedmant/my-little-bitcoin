const {TransactionError} = require('../errors');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const Joi = require('joi');
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

function isDataValid (transaction) {
  return Joi.validate(transaction, transactionSchema);
}

function checkTransactions (transactions) {
  transactions.forEach(tx => checkTransaction(tx));
  if (transactions.filter(tx => tx.reward).length !== 1) throw new TransactionError('Transactions must have exactly one reward transaction');
}

function checkTransaction (transaction) {
  if (! isDataValid(transaction)) throw new TransactionError('Transaction data is not valid');
  if (transaction.hash !== calculateHash(transaction)) throw new TransactionError('Invalid transaction hash');

  // Verify each input signature
  transaction.inputs.forEach(function (input) {
    if (! verifyInputSignature(input)) throw new TransactionError('Invalid input signature');
  });

  // Check if total output amount equals input amount
  if (! transaction.reward) {
    if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0)
      !== transaction.outputs.reduce((acc, output) => acc + output.amount, 0))
      throw new TransactionError('Input and output amounts dont match');
  }
}

function verifyInputSignature (input) {
  return wallet.verifySignature(input.address, input.signature, calculateInputHash(input));
}

function calculateInputHash ({transaction, amount, address}) {
  return CryptoJS.SHA256(JSON.stringify({transaction, amount, address})).toString();
}

function calculateHash ({id, type, inputs, outputs}) {
  return CryptoJS.SHA256(JSON.stringify({id, type, inputs, outputs})).toString();
}

function createTransaction (inputs, outputs, reward = false) {
  const tx = {
    id: crypto.randomBytes(32).toString('hex'),
    reward,
    inputs,
    outputs,
  };
  tx.hash = calculateHash(tx);

  return tx;
}

function createRewardTransaction (wallet) {
  return createTransaction([], [{amount: 50, address: wallet.public}], true);
}

function createInput (transaction, amount, wallet) {
  const input = {
    transaction,
    amount,
    address: wallet.public,
  };
  input.signature = wallet.signHash(wallet.secret, calculateInputHash(input));

  return input;
}

module.exports = {checkTransactions, checkTransaction, createTransaction, createRewardTransaction, createInput};
