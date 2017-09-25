const store = require('./store')
const {mine} = require('./miner')
const config = require('./config')
const bus = require('./bus')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const {TransactionError, GeneralError} = require('./errors')

const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)

const sockets = []

/*
 * Establish socket.io connection
 */
io.on('connection', function (socket) {
  sockets.push(socket)
  console.log('Websocket user connected')
  socket.on('disconnect', function () {
    console.log('Websocket user disconnected')
  })
})

/*
 * Broadacast messages
 */
bus.on('block-added', block => io.emit('block-added', block))
bus.on('block-added-by-me', block => io.emit('block-added-by-me', block))
bus.on('transaction-added', transaction => io.emit('transaction-added', transaction))
bus.on('balance-updated', balance => io.emit('balance-updated', balance))
bus.on('mine-start', () => io.emit('mine-started'))
bus.on('mine-stop', () => io.emit('mine-stopped'))
bus.on('recieved-funds', (data) => io.emit('recieved-funds', data))

/*
 * Parse JSON automatically
 */
app.use(bodyParser.json())

app.use('/', express.static(path.resolve(__dirname, '../dist')))

/*
 * Get short blockchain status
 */
app.get('/v1/status', (req, res) => res.json({
  chain: store.chain.slice(Math.max(store.chain.length - 5, 0)),
  mempool: store.mempool.slice(Math.max(store.mempool.length - 5, 0)),
  wallets: store.wallets.map(w => ({name: w.name, public: w.public, balance: store.getBalanceForAddress(w.public)})),
  mining: store.mining,
  demoMode: config.demoMode,
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
 * Get transaction by hash
 */
app.get('/v1/transaction/:txid', (req, res) => res.json({transaction: store.chain.find(block => {
  return block.transactions.find(tx => tx.id === req.params.txid)
})}))

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

http.listen(config.httpPort, 'localhost', () => console.log('Listening http on port: ' + config.httpPort))

module.exports = app
