const store = require('./store');
const config = require('./config');
const bus = require('./bus');
const WebSocket = require("ws");
const {BlockError, TransactionError} = require('./errors');

const connections = store.peers.map(peer => ({url: peer, ws: null, timeoutId: null, retries: 0}));

const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => connections.filter(c => c.ws).forEach(c => write(c.ws, message));

/*
 * Broadacast messages to all peers
 */
bus.on('block-added-by-me', block => broadcast({type: 'new-block', block}));
bus.on('transaction-added', transaction => broadcast({type: 'new-transaction', transaction}));

/**
 * Handle incoming messages
 *
 * @param connection
 */
function initMessageHandler (connection) {
  const ws = connection.ws;
  ws.on('message', (data) => {
    let message = '';
    try {
      message = JSON.parse(data);
    } catch (e) {
      message = e.message;
    }

    console.log('Received message: ' + JSON.stringify(message));

    // TODO: validate requests
    switch (message.type) {
      case 'get-blocks-after':
        write(ws, {type: 'blocks-after', blocks: store.blocksAfter(message.index + 1)});
        break;
      case 'blocks-after':
        message.blocks.forEach(block => {
          try {
            store.addBlock(block);
          } catch (e) {
            if (! e instanceof BlockError && ! e instanceof TransactionError) throw e;
          }
        });
        break;
      case 'new-block':
        try {
          // Load all blocks needed if recieved block is not next for our chain
          if (message.block.index - store.lastBlock().index > 1) {
            return write(ws, {type: 'get-blocks-after', index: store.lastBlock().index});
          }
          const block = store.addBlock(message.block);
          bus.emit('block-added', block);
        } catch (e) {
          if (! e instanceof BlockError && ! e instanceof TransactionError) throw e;
          write(ws, {type: 'error', message: e.message});
        }
        break;
      case 'new-transaction':
        try {
          write(ws, store.addTransaction(message.transaction, false));
        } catch (e) {
          write(ws, {type: 'error', message: e.message});
        }
        break;
    }
  });
}

function initErrorHandler (connection, index) {
  const closeConnection = (connection, index) => {
    console.log(`Connection broken to: ${connection.url === undefined ? 'incoming' : connection.url}`);
    connection.ws = null;
    if (connection.url && connection.retries < 4) {
      connection.retries++;
      console.log(`Retry in 3 secs, retries: ${connection.retries}`);
      connection.timeoutId = setTimeout(() => connectToPeer(connection, index), 3000);
    }
  };
  connection.ws.on('close', () => closeConnection(connection, index));
  connection.ws.on('error', () => closeConnection(connection, index));
}

function initConnection (ws, index = null) {
  let connection = null;
  if (index === null) {
    connection = {url: ws.url, ws, timeoutId: null, retries: 0};
    connections.push(connection);
  } else {
    connection = connections[index];
  }
  connection.retries = 0;

  console.log(`Connected to peer ${ws.url === undefined ? 'incoming' : ws.url}`);
  clearTimeout(connection.timeoutId);
  initMessageHandler(connection, index);
  initErrorHandler(connection, index);

  // Get full blockchain from first peer
  if (index === 0) {
    write(connection.ws, {type: 'get-blocks-after', index: store.lastBlock().index});
  }
}

function connectToPeer(connection, index) {
  connection.ws = new WebSocket(connection.url);
  connection.ws.on('open', () => initConnection(connection.ws, index));
  connection.ws.on('error', () => {
    console.log(`Connection failed to ${connection.url}`);
    if (connection.url && connection.retries < 4) {
      console.log(`Retry in 3 secs, retries: ${connection.retries}`);
      connection.retries++;
      connection.timeoutId = setTimeout(() => {connectToPeer(connection, index)}, 3000);
    }
  });
}

connections.forEach((connection, index) => connectToPeer(connection, index));

const server = new WebSocket.Server({port: config.p2pPort});

server.on('connection', ws => initConnection(ws));

console.log('listening websocket p2p port on: ' + config.p2pPort);
