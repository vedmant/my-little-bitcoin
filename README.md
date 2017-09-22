# my-little-bitcoin

> Sample naive cryptocurrency implementation on JavaScript for studying purpose

## Features

- Blocks mining and simple POW with reward
- Create transactions and send amount to address using unspent outputs
- Check address balance
- Peer to peer connection, blockchain synchronization

## TODO

- Demo mode mining using timeout
- Add signature to outputs for transaction, validate signature
- Multiple wallets
- Front end UI
- Implement peers blockhains conflict resolution

## Backend setup

``` bash
# install dependencies
yarn

# Start first node
npm start

# Start second node
npm start2

# Start third node
npm start3
```

## Frontend build Setup

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```
 