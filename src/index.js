require('./server') // HTTP server and Web sockets
const config = require('./config')

if (! config.demoMode) {
  require('./peers') // Connect to peers and recieve connections
}
