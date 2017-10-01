# My Little Bitcoin

> A simple cryptocurrency implementation on JavaScript in just about 650 lines of code (with comments) for blockchain and 300 for peer to peer connections and web API. It also includes WEB GUI written on Vue.js where you can send coins and explore blockchain.

[See Demo Here](https://my-little-bitcoin.vedmant.com/)

## Features

- Blocks mining with reward and simple POW 
- Create transactions and send amount to address using unspent outputs
- Peer to peer connection, blockchain synchronization
- Multiple wallets, add new wallet
- Demo mode mining to reduce CPU load
- User interface with real time data change
- Status page with latest blocks, current mempool, wallets list with balances
- Chain explorer pages for block, address, transaction
- Descriptive debug messages in develpment mode using debug package
- Server requests logs with winston

## TODO

- Add signature to outputs for transaction, validate signature
- Implement peers blockhains conflict resolution, download only needed part of chain since split
- Add stats page with charts in UI, use separate chart module to cache chart data on server
- Automatic difficulty adjustment to match 1 minute block time

### Installation ###

```
git clone https://github.com/vedmant/my-little-bitcoin.git # To clone repo
cd my-little-bitcoin
yarn # Install php dependencies
npm run prod # Compile frontend resources

npm run demo
```

And open it on: [http://localhost:3001/](http://localhost:3001/)

## Full backend run commands

``` bash
# Start demo node
npm run demo

# Start first node
npm start

# Start second node
npm run start2

# Start third node
npm run start3
```

## Frontend development

``` bash
# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run prod

# build for production and view the bundle analyzer report
npm run prod --report
```
 
### License ###

And of course:

[MIT](LICENSE.md)
