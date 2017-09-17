const express = require('express');
const bodyParser = require('body-parser');
const store = require('./store');
const {mineBlock} = require('./util/block');
const config = require('./config');
const co = require('co');

const app = express();
app.use(bodyParser.json());

app.get('/chain', (req, res) => res.send(JSON.stringify(store.chain)));

app.get('/blocks-after/:index', (req, res) => res.send(JSON.stringify(store.blocksAfter(req.params.index))));

app.get('/mine-block', (req, res) => {
    co(function* () {
        store.addBlock(yield mineBlock(store.mempool, store.lastBlock(), store.difficulty));
    }).then(() => {res.send('Block mined')});
});

app.get('/peers', (req, res) => {
    res.send(store.peers);
});

app.post('/add-peer', (req, res) => {
    store.addPeer(req.body.peer);
    res.send();
});

app.listen(config.http_port, () => console.log('Listening http on port: ' + config.http_port));

module.exports = app;
