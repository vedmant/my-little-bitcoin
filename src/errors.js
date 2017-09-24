class BlockError extends Error {}

class TransactionError extends Error {}

class GeneralError extends Error {}

module.exports = {BlockError, TransactionError, GeneralError}
