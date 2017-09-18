const express = require('express');
const bodyParser = require('body-parser');
const store = require('./store');
const {mineBlock} = require('./lib/block');
const config = require('./config');
const co = require('co');
const bus = require('./bus');

const app = express();
app.use(bodyParser.json());

app.get('/status', (req, res) => res.send(JSON.stringify(store)));

app.get('/send/:address/:amount', (req, res) => res.send(store.send(req.params.address, req.params.amount)));

app.get('/chain', (req, res) => res.send(JSON.stringify(store.chain)));

app.get('/blocks-after/:index', (req, res) => res.send(JSON.stringify(store.blocksAfter(req.params.index))));

app.get('/balance/:address', (req, res) => res.send(JSON.stringify({balance: store.getBalanceForAddress(req.params.address)})));

app.get('/mine', (req, res) => {
  res.setHeader('Connection', 'Transfer-Encoding');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.write('<pre>Started mining...\n');
  console.log('Started mining...');
  let mine = true;
  req.connection.on('close', function () {
    mine = false;
    bus.emit('mine-stop');
  });
  co(function* () {
    while (mine) {
      store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty, store.wallet.public));
      res.write('Mined a block, balance: ' + store.getBalance() + '\n');
    }
  }).catch(e => console.log(e));
});

app.get('/peers', (req, res) => {
  res.send(store.peers);
});

app.post('/add-peer', (req, res) => {
  store.addPeer(req.body.peer);
  res.send();
});

app.listen(config.httpPort, () => console.log('Listening http on port: ' + config.httpPort));

module.exports = app;
