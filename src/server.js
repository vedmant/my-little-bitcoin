const debug = require('debug')('app:server')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const expressWinston = require('express-winston')
const winston = require('winston')
const {generateKeyPair} = require('./lib/wallet')
const {TransactionError, GeneralError} = require('./errors')

module.exports = (config, bus, store, miner) => ({
  app: null,
  http: null,
  io: null,

  broadcast (type, data) {
    debug(`Broadcast WS message: ${type}`)
    this.io.emit(type, data)
  },

  start () {
    this.app = express()
    this.http = require('http').Server(this.app)
    this.io = require('socket.io')(this.http)

    // Establish socket.io connection
    this.io.on('connection', function (socket) {
      debug('Websocket user connected')
      socket.on('disconnect', function () {
        debug('Websocket user disconnected')
      })
    })

    // Broadacast messages
    bus.on('block-added', block => this.broadcast('block-added', block))
    bus.on('block-added-by-me', block => this.broadcast('block-added-by-me', block))
    bus.on('transaction-added-by-me', transaction => this.broadcast('transaction-added', transaction))
    bus.on('transaction-added', transaction => this.broadcast('transaction-added', transaction))
    bus.on('balance-updated', balance => this.broadcast('balance-updated', balance))
    bus.on('mine-start', () => this.broadcast('mine-started'))
    bus.on('mine-stop', () => this.broadcast('mine-stopped'))
    bus.on('recieved-funds', (data) => this.broadcast('recieved-funds', data))

    // Parse bodies
    this.app.use(bodyParser.json()) // support json encoded bodies
    this.app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

    // Add winston logger
    this.app.use(expressWinston.logger({transports: [new winston.transports.File({
      filename: 'logs/express.log', json: false, maxsize: 1024 * 1024, maxFiles: 100, tailable: true,
    })]}))

    // Serve static files
    this.app.use('/', express.static(path.resolve(__dirname, '../dist')))

    /*
     * Get short blockchain status
     */
    this.app.get('/v1/status', (req, res) => res.json({
      time: Math.floor(new Date().getTime() / 1000),
      chain: store.chain.slice(Math.max(store.chain.length - 5, 0)),
      mempool: store.mempool.slice(Math.max(store.mempool.length - 5, 0)),
      wallets: store.wallets.map(w => ({name: w.name, public: w.public, balance: store.getBalanceForAddress(w.public)})),
      mining: store.mining,
      demoMode: !! config.demoMode,
    }))

    /*
     * Send money to address
     */
    this.app.get('/v1/send/:from/:to/:amount', (req, res) => {
      try {
        res.json(store.send(req.params.from, req.params.to, parseInt(req.params.amount)))
      } catch (e) {
        if (! (e instanceof GeneralError) && ! (e instanceof TransactionError)) throw e
        res.status(403).send(e.message)
      }
    })

    /*
     * Get block by index
     */
    this.app.get('/v1/block/:index', (req, res) => res.json({block: store.chain.find(b => b.index === parseInt(req.params.index))}))

    /*
     * Get address
     */
    this.app.get('/v1/address/:address', (req, res) => {
      const transactions = store.getTransactionsForAddress(req.params.address)
      res.json({
        balance: store.getBalanceForAddress(req.params.address),
        transactions: transactions.slice(-100).reverse(), // Last 100 transactions
        totalTransactions: transactions.length,
        totalRecieved: transactions.reduce((acc, tx) => acc + tx.outputs.reduce((acc, o) => acc + (o.address === req.params.address ? o.amount : 0), 0), 0),
      })
    })

    /*
     * Get transaction by txid
     */
    this.app.get('/v1/transaction/:id', (req, res) => {
      const transaction = store.getTransactions().find(tx => tx.id === req.params.id)
      if (! transaction) return res.status(404).send('Cant find transaction')
      const block = store.chain.find(block => block.transactions.find(tx => tx.id === req.params.id))
      res.json({transaction, block})
    })

    /*
     * My Wallets
     */
    this.app.get('/v1/wallets', (req, res) => res.json(store.wallets.map(wallet => {
      const transactions = store.getTransactionsForAddress(wallet.public).reverse()
      return {
        name: wallet.name,
        public: wallet.public,
        balance: store.getBalanceForAddress(wallet.public),
        totalTransactions: transactions.length,
        transactions: transactions.slice(Math.max(transactions.length - 100, 0)),
        totalRecieved: transactions.reduce((acc, tx) => acc + tx.outputs.reduce((acc, o) => acc + (o.address === wallet.public ? o.amount : 0), 0), 0),
        totalSent: transactions.reduce((acc, tx) => acc + tx.inputs.reduce((acc, i) => acc + (i.address === wallet.public ? i.amount : 0), 0), 0),
      }
    })))

    /*
     * Create new wallet
     */
    this.app.post('/v1/wallet/create', (req, res) => {
      const wallet = {name: req.body.name, ...generateKeyPair()}
      store.addWallet(wallet)
      res.json({name: wallet.name, public: wallet.public, balance: store.getBalanceForAddress(wallet.public)})
    })

    /*
     * Start mining
     */
    this.app.get('/v1/mine-start', (req, res) => {
      store.mining = true
      bus.emit('mine-start')
      if (! config.demoMode) miner.mine(store.wallets[0])
      res.json('Ok')
    })

    /*
     * Stop mining
     */
    this.app.get('/v1/mine-stop', (req, res) => {
      if (config.demoMode) return res.status(403).send('Can not stop miner in Demo mode')
      store.mining = false
      bus.emit('mine-stop')
      res.json('Ok')
    })

    this.http.listen(config.httpPort, config.httpHost, () => debug('Listening http on host: ' + config.httpHost + '; port: ' + config.httpPort))
  },

})
