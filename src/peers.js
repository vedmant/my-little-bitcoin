const debug = require('debug')('app:peers')
const WebSocket = require('ws')
const {BlockError, TransactionError} = require('./errors')

module.exports = (config, bus, store) => ({

  connections: store.peers.map(peer => ({url: peer, ws: null, timeoutId: null, retries: 0, initial: true})),

  server: null,

  write (connection, message) {
    debug(`Send message: ${message.type} to: ${connection.url}`)
    connection.ws.send(JSON.stringify(message))
  },

  broadcast (message) {
    debug(`Broadcast message: ${message.type}`)
    this.connections.filter(c => c.ws).forEach(c => this.write(c, message))
  },

  /**
   * Handle incoming messages
   *
   * @param connection
   */
  initMessageHandler (connection) {
    const ws = connection.ws

    ws.on('message', (data) => {
      let message = ''
      try {
        message = JSON.parse(data)
      } catch (e) {
        console.error('Failed to json parse recieved data from peer')
      }

      debug(`Received message: ${message.type}`)

      // TODO: validate requests
      switch (message.type) {
        case 'get-blocks-after':
          this.write(connection, {type: 'blocks-after', blocks: store.blocksAfter(message.index + 1)})
          break

        case 'blocks-after':
          message.blocks.forEach(block => {
            try {
              store.addBlock(block)
            } catch (e) {
              if (! (e instanceof BlockError) && ! (e instanceof TransactionError)) throw e
            }
          })
          break

        case 'new-block':
          try {
            // Load all blocks needed if recieved block is not next for our chain
            if (message.block.index - store.lastBlock().index > 1) {
              return this.write(connection, {type: 'get-blocks-after', index: store.lastBlock().index})
            }
            const block = store.addBlock(message.block)
            bus.emit('block-added', block)
          } catch (e) {
            if (! (e instanceof BlockError) && ! (e instanceof TransactionError)) throw e
            this.write(connection, {type: 'error', message: e.message})
          }
          break

        case 'new-transaction':
          try {
            store.addTransaction(message.transaction, true)
          } catch (e) {
            this.write(connection, {type: 'error', message: e.message})
          }
          break
      }
    })
  },

  /**
   * Handle connection errors
   *
   * @param connection
   * @param index
   */
  initErrorHandler (connection, index) {
    const closeConnection = (connection, index) => {
      debug(`Connection broken to: ${connection.url === undefined ? 'incoming' : connection.url}`)
      connection.ws = null

      // Retry initial connections 3 times
      if (connection.initial && connection.retries < 4) {
        connection.retries++
        debug(`Retry in 3 secs, retries: ${connection.retries}`)
        connection.timeoutId = setTimeout(() => this.connectToPeer(connection, index), 3000)
      }
    }
    connection.ws.on('close', () => closeConnection(connection, index))
    connection.ws.on('error', () => closeConnection(connection, index))
  },

  /**
   * Handle connection initialization
   *
   * @param ws
   * @param req
   * @param index
   */
  initConnection (ws, req = null, index = null) {
    let connection = null
    let url = ws.url

    if (index === null) {
      // If peer connected to us
      url = req.connection.remoteAddress
      connection = {url, ws, timeoutId: null, retries: 0, initial: false}
      this.connections.push(connection)
      debug(`Peer ${url} connected to us`)
    } else {
      // We connected to peer
      connection = this.connections[index]
      debug(`Connected to peer ${url}`)
    }
    connection.retries = 0

    clearTimeout(connection.timeoutId)
    this.initMessageHandler(connection, index)
    this.initErrorHandler(connection, index)

    // Get full blockchain from first peer
    if (index === 0) {
      this.write(connection, {type: 'get-blocks-after', index: store.lastBlock().index})
    }
  },

  /**
   * Connect to peer
   *
   * @param connection
   * @param index
   * @param req
   */
  connectToPeer (connection, index = null) {
    connection.ws = new WebSocket(connection.url)
    connection.ws.on('open', () => this.initConnection(connection.ws, null, index))
    connection.ws.on('error', () => {
      debug(`Connection failed to ${connection.url}`)

      // Retry initial connections 3 times
      if (connection.initial && connection.retries < 4) {
        debug(`Retry in 3 secs, retries: ${connection.retries}`)
        connection.retries++
        connection.timeoutId = setTimeout(() => {
          this.connectToPeer(connection, index)
        }, 3000)
      }
    })
  },

  start () {
    // Broadacast messages to all peers
    bus.on('block-added-by-me', block => this.broadcast({type: 'new-block', block}))
    bus.on('transaction-added-by-me', transaction => this.broadcast({type: 'new-transaction', transaction}))

    this.connections.forEach((connection, index) => this.connectToPeer(connection, index))

    this.server = new WebSocket.Server({port: config.p2pPort})
    this.server.on('connection', (ws, req) => this.initConnection(ws, req))

    debug('listening websocket p2p port on: ' + config.p2pPort)
  },
})
