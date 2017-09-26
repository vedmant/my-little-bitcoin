global.debug = require('debug')('app:global')
require('./server') // HTTP server and Web sockets
const config = require('./config')
const store = require('./store')
const {mine} = require('./miner')

if (config.demoMode) {
  mine(store.wallets[0])
} else {
  require('./peers') // Connect to peers and recieve connections
}
