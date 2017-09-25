const {isBlockValid} = require('./block')

function isChainValid (chain, difficulty) {
  for (let i = 1; i < chain.length; i++) {
    if (! isBlockValid(chain[i - 1], chain[i], difficulty)) {
      return false
    }
  }

  return true
}

module.exports = {isChainValid}
