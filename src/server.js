const store = require('./store')
const {mine} = require('./miner')
const config = require('./config')
const bus = require('./bus')
const {BlockError, TransactionError} = require('./errors')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)

const sockets = []

io.on('connection', function (socket) {
  sockets.push(socket)
  console.log('Websocket user connected')
  socket.on('disconnect', function () {
    console.log('Websocket user disconnected')
  })
})

const broadcast = (type, message) => sockets.forEach(c => sockets.emit(type, message))

/*
 * Broadacast messages
 */
bus.on('block-added', block => io.emit('block-added', block))
bus.on('block-added-by-me', block => io.emit('block-added-by-me', block))
bus.on('transaction-added', transaction => io.emit('transaction-added', transaction))
bus.on('balance-updated', balance => io.emit('balance-updated', balance))
bus.on('mine-start', () => io.emit('mine-started'))
bus.on('mine-stop', () => io.emit('mine-stopped'))


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
  wallets: [
    {name: 'Main', public: store.wallet.public, balance: store.getBalanceForAddress(store.wallet.public)},
  ],
  mining: store.mining,
  demoMode: config.demoMode,
}))

app.get('/v1/send/:address/:amount', (req, res) => {
  res.json(store.send(req.params.address, req.params.amount))
})

app.get('/v1/balance/:address', (req, res) => res.json({balance: store.getBalanceForAddress(req.params.address)}))

app.get('/v1/block/:index', (req, res) => res.json({block: store.chain.find(b => b.index === req.params.index)}))

app.get('/v1/transaction/:index', (req, res) => res.json({transaction: store.chain.find(b => b.index === req.params.index)}))

app.get('/v1/mine-start', (req, res) => {
  store.mining = true
  bus.emit('mine-start')
  if (!config.demoMode) mine()
  res.json('Ok')
})

app.get('/v1/mine-stop', (req, res) => {
  store.mining = false
  if (config.demoMode) return res.status(403).send('Can not stop miner in Demo mode')
  bus.emit('mine-stop')
  res.json('Ok')
})

http.listen(config.httpPort, () => console.log('Listening http on port: ' + config.httpPort))


module.exports = app
