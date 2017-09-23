require('./server') // HTTP server and Web sockets
const config = require('./config')
const store = require('./store')
const {mine} = require('./miner')

if (config.demoMode) {
  mine()
} else {
  require('./peers') // Connect to peers and recieve connections
}
