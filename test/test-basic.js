var assert = require('assert');

var sticky = require('../');
var path = require('path')
var http = require('http');
var recluster = require('recluster');

var PORT = 8099


function once(condition, execution) {
    function check() {
        if (condition()) {
            clearInterval(interval)
            execution();
        }
    }
    var interval = setInterval(check, 33)
}

function test() {
    var cluster = recluster(path.join(__dirname, 'harness/server.js'), {
        readyWhen: 'ready'
    });
    cluster.run();

    var balancer = sticky.createBalancer({activeWorkers: cluster.activeWorkers})
    balancer.listen(PORT, function() { setTimeout(afterListen, 10); })
    function afterListen() {
        // Master
        var waiting = 100
        for (var i = 0; i < waiting; i++) {
            http.request({
            method: 'GET',
            host: '127.0.0.1',
            port: PORT
            }, done).end()
        }

        function done(res) {
            res.resume();
            if (--waiting === 0)
            process.exit(0);
        }
    }
}

test();