const debug = require('debug')('app:server')
const store = require('./store')
const {mine} = require('./miner')
const config = require('./config')
const bus = require('./bus')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const expressWinston = require('express-winston')
const winston = require('winston')
const {generateKeyPair} = require('./lib/wallet')
const {TransactionError, GeneralError} = require('./errors')

const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)

/*
 * Establish socket.io connection
 */
io.on('connection', function (socket) {
  debug('Websocket user connected')
  socket.on('disconnect', function () {
    debug('Websocket user disconnected')
  })
})

function broadcast (type, data) {
  debug(`Broadcast WS message: ${type}`)
  io.emit(type, data)
}

/*
 * Broadacast messages
 */
bus.on('block-added', block => broadcast('block-added', block))
bus.on('block-added-by-me', block => broadcast('block-added-by-me', block))
bus.on('transaction-added', transaction => broadcast('transaction-added', transaction))
bus.on('balance-updated', balance => broadcast('balance-updated', balance))
bus.on('mine-start', () => broadcast('mine-started'))
bus.on('mine-stop', () => broadcast('mine-stopped'))
bus.on('recieved-funds', (data) => broadcast('recieved-funds', data))

/*
 * Parse bodies
 */
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

// Add winston logger
app.use(expressWinston.logger({transports: [new winston.transports.File({
  filename: 'logs/express.log', json: false, maxsize: 1024 * 1024, maxFiles: 100, tailable: true,
})]}))

// Serve static files
app.use('/', express.static(path.resolve(__dirname, '../dist')))

/*
 * Get short blockchain status
 */
app.get('/v1/status', (req, res) => res.json({
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
app.get('/v1/send/:from/:to/:amount', (req, res) => {
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
app.get('/v1/block/:index', (req, res) => res.json({block: store.chain.find(b => b.index === parseInt(req.params.index))}))

/*
 * Get address
 */
app.get('/v1/address/:address', (req, res) => {
  const transactions = store.getTransactionsForAddress(req.params.address).reverse()
  res.json({
    balance: store.getBalanceForAddress(req.params.address),
    transactions: transactions.slice(Math.max(transactions.length - 100, 0)), // Last 100 transactions
    totalTransactions: transactions.length,
    totalRecieved: transactions.reduce((acc, tx) => acc + tx.outputs.reduce((acc, o) => acc + (o.address === req.params.address ? o.amount : 0), 0), 0),
  })
})

/*
 * Get transaction by txid
 */
app.get('/v1/transaction/:id', (req, res) => {
  const transaction = store.getTransactions().find(tx => tx.id === req.params.id)
  if (! transaction) return res.status(404).send('Cant find transaction');
  const block = store.chain.find(block => block.transactions.find(tx => tx.id === req.params.id))
  res.json({transaction, block})
})

/*
 * My Wallets
 */
app.get('/v1/wallets', (req, res) => res.json(store.wallets.map(wallet => {
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
app.post('/v1/wallet/create', (req, res) => {
  const wallet = {name: req.body.name, ...generateKeyPair()}
  store.addWallet(wallet)
  res.json({name: wallet.name, public: wallet.public, balance: store.getBalanceForAddress(wallet.public)})
})

/*
 * Start mining
 */
app.get('/v1/mine-start', (req, res) => {
  store.mining = true
  bus.emit('mine-start')
  if (! config.demoMode) mine(store.wallets[0])
  res.json('Ok')
})

/*
 * Stop mining
 */
app.get('/v1/mine-stop', (req, res) => {
  if (config.demoMode) return res.status(403).send('Can not stop miner in Demo mode')
  store.mining = false
  bus.emit('mine-stop')
  res.json('Ok')
})

http.listen(config.httpPort, config.httpHost, () => debug('Listening http on port: ' + config.httpPort))

module.exports = app
