![actions workflow](https://github.com/vedmant/my-little-bitcoin/workflows/Test/badge.svg)

# My Little Bitcoin

> A simple cryptocurrency implementation on JavaScript in just about 650 lines of code (without comments and client). It also includes WEB GUI written on Vue.js where you can send coins and explore blockchain.

This implementation is pretty naive and suitable only for studying purpose.

[See Demo Here](https://my-little-bitcoin.vedmant.com/)

## Features

- Blocks mining with reward and simple POW
- Create transactions and send amount to address using unspent outputs
- Peer to peer connection, blockchain synchronization
- Multiple wallets, add new wallet feature
- Demo mode mining to reduce CPU load
- User interface with real time data change
- Status page with latest blocks, current mempool, wallets list with balances
- Chain explorer for blocks, addresses, transactions
- Descriptive debug messages in develpment mode using debug package
- Server requests logs with winston

### Installation ###

```bash
git clone https://github.com/vedmant/my-little-bitcoin.git # To clone repo
cd my-little-bitcoin
yarn # Install dependencies
yarn prod # Compile frontend resources

yarn demo # Run in demo mode
```

And open it on: [http://localhost:3001/](http://localhost:3001/)

## Full list of backend run commands

```bash
# Start demo node
yarn demo

# Start first node
yarn start

# Start second node
yarn start2

# Start third node
yarn start3
```

## Run 3 nodes with Docker

This will require installed Docker to your PC, run:

```bash
docker-compose up
```

It will build and run all needed containers and run application with exposed ports 3001, 3002, 3003.

Then you can open 3 different nodes that will communicate between each other on:
http://localhost:3001
http://localhost:3002
http://localhost:3003

Start mining on one of the nodes to make network add new blocks, you can start mining on each node. Beware, it can consume a lot of CPU resources.

## Frontend development

```bash
# serve with hot reload at localhost:8080
yarn dev

# build for production with minification
yarn prod
```

## TODO

- Add unit tests
- Add feature tests
- Keep list of unspent transactions in a separate store array instead of filtering it on every request
- Implement peers blockhains conflict resolution, download only needed part of chain since split
- Add stats page with charts in UI, use separate chart module to cache chart data on server
- Automatic difficulty adjustment to match 1 minute block time
- Integrate NeDB to store blockchain persistently

### License ###

And of course:

[MIT](LICENSE.md)
