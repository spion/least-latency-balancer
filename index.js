var Master = require('./lib/master')
var Buffer = require('buffer').Buffer;

exports.createBalancer = createBalancer;

function createBalancer(options) {
    var master = new Master(options);
    return master;
}

exports.listen = listen;

function listen(server) {
    process.on('message', function(data, socket) {
        if (data.msg === 'sticky:balance' && socket != null) {
            server.emit('connection', socket);
        }
        else if (data.msg === 'sticky:ping') {
            process.send(data)
        }
    });
    server.emit('listening')
    return true;
}