var util = require('util')
var net = require('net')

module.exports = Master;

util.inherits(Master, net.Server);
function Master(options) {
    if (!options || typeof options.activeWorkers != 'function') {
        throw new TypeError("Must provide activeWorkers option (returns a list of worker processes)")
    }
    net.Server.call(this, {
        pauseOnConnect: true
    }, this.balance)
    this.workers = options.activeWorkers;
    this.retryDelay = options.retryDelay || 150
    this.maxRetries = options.maxRetries || 5
    this.behindProxy = options.behindProxy || false;
    this.cipHeader = options.cipHeader || 'x-forwarded-for'
    this.id = 0;
}

Master.prototype.balance = function balance(socket) {
  var id = this.id = (this.id + 1) & 0xFFFFF
  var workers = this.workers();
  for (var k = 0; k < workers.length; ++k) {
    var wrk = (k + id) % workers.length
    if (workers[wrk] !== null) {
      workers[wrk].on('message', waitResponse)
      workers[wrk].send({msg: 'sticky:ping', id: id, wrk: wrk})
    }
  }
  function waitResponse(msg) {
    if (msg.msg !== 'sticky:ping' || msg.id !== id) return;
    for (var k = 0; k < workers.length; ++k) if (workers[k] !== null) {
      workers[k].removeListener('message', waitResponse)
    }
    workers[msg.wrk].send({msg: 'sticky:balance', payload: null }, socket);
  }
}
