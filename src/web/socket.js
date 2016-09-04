'use strict';

const cluster = require('cluster');
const path = require('path');


module.exports = function(server) {
    const socket_io = require('socket.io')(server);
    const workers = {}; // {user_id: worker_id}

    socket_io.on('connection', (socket) => {
        socket.emit('stalk-data', 'Connecting...');
        socket.emit('connection', 'Done!');

        socket.on('stalk-request', user_id => {
            const worker_id = workers[user_id];
            let worker = cluster.workers[worker_id];
            if (!worker) {
                console.log('Creating new WORKER.');
                cluster.setupMaster({
                    exec: path.resolve(__dirname, '../vkstalk'),
                    args: ['stalk', user_id],
                    silent: true
                });

                worker = cluster.fork();
                workers[user_id] = worker.id;
            } else {
                console.log('Receiving info from an existing worker');
            }

            worker.process.stdout.on('data', buffer => {
                socket.emit('stalk-data', buffer.toString('utf8'));
            });
        });

        socket.on('disconnect', () => {
            Object.keys(cluster.workers).forEach(id => cluster.workers[id].kill());
        });
    });
};
