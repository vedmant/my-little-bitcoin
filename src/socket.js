const store = require('./store');
const config = require('./config');
const co = require('co');
const bus = require('./bus');
const WebSocket = require("ws");

const sockets = [];

const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => sockets.forEach(socket => write(socket, message));

bus.on('block-added', block => broadcast({type: 'add-block', block}));

bus.on('transaction-added', transaction => broadcast({type: 'add-transaction', transaction}));

function initMessageHandler (ws) {
  ws.on('message', (data) => {
    let message = '';
    try {
      message = JSON.parse(data);
    } catch (e) {
      message = e.message;
    }

    console.log('Received message: ' + JSON.stringify(message));

    switch (message.type) {
      case 'last-block':
        write(ws, store.lastBlock());
        break;
      case 'blocks-after':
        write(ws, store.blocksAfter(message.index));
        break;
      case 'add-block':
        write(ws, store.addBlock(message.block));
        break;
      case 'add-transaction':
        try {
          write(ws, store.addTransaction(message.transaction, false));
        } catch (e) {write(ws, e.message)}
        break;
    }
  });
}

function initErrorHandler (ws) {
  const closeConnection = (ws) => {
    console.log('connection failed to peer: ' + ws.url);
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on('close', () => closeConnection(ws));
  ws.on('error', () => closeConnection(ws));
}

function initConnection (ws) {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  write(ws, {type: 'last-block'});
}

function connectToPeers (newPeers) {
  console.log()
  newPeers.forEach((peer) => {
    const ws = new WebSocket(peer);
    ws.on('open', () => initConnection(ws));
    ws.on('error', () => {
      console.log('connection failed')
    });
  });
}

connectToPeers(store.peers);

const server = new WebSocket.Server({port: config.p2pPort});

server.on('connection', ws => initConnection(ws));

console.log('listening websocket p2p port on: ' + config.p2pPort);
