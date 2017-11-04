module.exports = {
  httpPort: process.env.HTTP_PORT || 3001,
  httpHost: process.env.HTTP_HOST || 'localhost',
  p2pPort: process.env.P2P_PORT || 6001,
  initialPeers: process.env.PEERS ? process.env.PEERS.split(',') : [],
  miningReward: 50,
  demoMode: process.env.DEMO || false,
}
