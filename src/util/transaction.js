const CryptoJS = require('crypto-js');
const Joi = require('joi');
const bitcoin = require('bitcoinjs-lib');

const transactionSchema = Joi.object().keys({
    id: Joi.string().hex().length(64),
    hash: Joi.string().hex().length(64),
    type: Joi.string(),
    data: Joi.array().items(Joi.object().keys({
        inputs: Joi.array().items(Joi.object().keys({
            index: Joi.number(),
            transaction: Joi.string().hex().length(64),
            amount: Joi.number(),
            address: Joi.string().hex().length(64),
            signature: Joi.string().hex().length(64),
        })),
        outputs: Joi.array().items(Joi.object().keys({
            amount: Joi.number(),
            address: Joi.string().hex().length(64),
        })),
    })),
});

function isDataValid (transaction) {
    return Joi.validate(transaction, transactionSchema);
}

function calculateHash ({id, type, data}) {
    return CryptoJS.SHA256(JSON.stringify({id, type, data})).toString();
}

function createTransaction (input, outputs) {
    const tx = new bitcoin.TransactionBuilder();
}

module.exports = {transactionSchema, isDataValid, calculateHash};
