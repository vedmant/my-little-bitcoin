import express from 'express';
import bodyParser from 'body-parser';
import store from './store'
import {mineBlock} from './util/block'
import config from './config'
import co from 'co';

const app = express();
app.use(bodyParser.json());

app.get('/chain', (req, res) => res.send(JSON.stringify(store.chain)));

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

export default app;
