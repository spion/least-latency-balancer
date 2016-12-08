# least-latency-balancer

Least-latency balancer for recluster

## Installation

```bash
npm install least-latency-balancer
```

## Usage

In your `cluster.js` that uses [recluster][recluster], use `llb.createBalancer`
to create a LL balancing server.

```js
var recluster = require('recluster'),
    path = require('path'),
    llb = require('least-latency-balancer')

var cluster = recluster(path.join(__dirname, 'server.js'), {
  readyWhen: 'ready'
});

cluster.run();

process.on('SIGUSR2', function() {
    console.log('Got SIGUSR2, reloading cluster...');
    cluster.reload();
});

console.log("spawned cluster, kill -s SIGUSR2", process.pid, "to reload");

// Added for the balancer:

var balancer = llb.createBalancer({
  activeWorkers: cluster.activeWorkers,
});

balancer.listen(8081, function() {
  console.log("Least latency balancer listening on port", 8081);
});

```

In your `server.js`, use `llb.listen` instead of `server.listen` to start the server,
then use `process.send({cmd: 'ready'})` to indicate that the worker is ready.

```javascript
var llb = require('least-latency-balancer');

var server = require('http').createServer(function(req, res) {
  res.end('worker: ' + process.env.NODE_WORKER_ID);
});

llb.listen(server)

process.send({cmd: 'ready'})
```

## Acknowledgement

This module is based on Fedor Indutny's [sticky-session][sticky-session],
but it decouples the worker management logic, enabling you to use any cluster
library (such as recluster). The only requirement is that `createBalancer`
needs to be passed `activeWorkers`, a function that returns a hash containing

* a field `length`, the number of worker slots that serve requests
* for every key `0..length`, a field that contains a [worker object][api-cluster-worker]
  of a worker that is capable of receiving new connections. If a worker isn't
  ready at that slot, the field should be `null`

## API

### llb.listen(server)

For use from the worker process

Listens for connections from a worker server. The port doesn't need
to be specified.

### llb.createBalancer(options)

For use from the master process

Creates a new master balancer server that balances between worker servers.

Returns a regular `net.Server`. Call server.listen(port) to start listening
for connections and balancing those connections across the cluster.

The available options are

##### `activeWorkers`

A function that returns a hash of the worker slots. For recluster based
clusters that would be `cluster.activeWorkers`. The hash should contain:

* a field `length`, the number of worker slots that serve requests
* for every key `0..length`, a field that contains a [worker object][api-cluster-worker]
  of a worker that is capable of receiving new connections. If a worker isn't
  ready at that slot, the field should be `null`

## LICENSE

This software is licensed under the MIT License.

Copyright Fedor Indutny, 2016; Gorgi Kosev, 2016.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.

[recluster]: https://github.com/doxout/recluster
[api-cluster-worker]: https://nodejs.org/api/cluster.html#cluster_class_worker
[sticky-session]: (https://github.com/indutny/sticky-session)
