const EventEmitter = require('events')

class Bus extends EventEmitter {
}

module.exports = new Bus()
