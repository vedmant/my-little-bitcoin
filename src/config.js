export default {
     http_port: process.env.HTTP_PORT || 3001,
     p2p_port: process.env.P2P_PORT || 6001,
     initialPeers: process.env.PEERS ? process.env.PEERS.split(',') : [],
}
