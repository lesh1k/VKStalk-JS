'use strict';

const cluster = require('cluster');
const path = require('path');


module.exports = function(server) {
    const socket_io = require('socket.io')(server);
    const workers = {}; // {stalked_id: worker_id}

    socket_io.on('connection', (socket) => {
        socket.emit('connection', {message: 'Connection established.'});
        socket.on('join-room', room => {
            const stalked_id = room;

            console.log(`Joining room ${room}`);
            socket.join(room, err => {
                if (err) {
                    console.log(err);
                }
            });

            socket_io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message:'Connecting...'});

            const worker_id = workers[stalked_id];
            let worker = cluster.workers[worker_id];
            if (!worker) {
                socket_io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message: 'Stalker offline. Click "STALK" to turn it on.'});
            } else {
                socket_io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message:'Connected. Waiting for a message...'});
                worker.process.stdout.on('data', buffer => {
                    socket_io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message: buffer.toString('utf8')});
                });
            }
        });

        socket.on('stalk-request', stalked_id => {
            const worker_id = workers[stalked_id];
            let worker = cluster.workers[worker_id];
            if (!worker) {
                console.log('Creating new WORKER.');
                cluster.setupMaster({
                    exec: path.resolve(__dirname, '../vkstalk'),
                    args: ['stalk', stalked_id],
                    silent: true
                });

                worker = cluster.fork();
                workers[stalked_id] = worker.id;
            } else {
                console.log('Receiving info from an existing worker');
            }

            worker.process.stdout.on('data', buffer => {
                socket_io.sockets.to(stalked_id).emit('stalk-data', {stalked_id: stalked_id, message: buffer.toString('utf8')});
            });
        });

        // socket.on('disconnect', () => {
        //     Object.keys(cluster.workers).forEach(id => cluster.workers[id].kill());
        // });

        socket.on('stop-worker', stalked_id => {
            const worker_id = workers[stalked_id];
            cluster.workers[worker_id].kill();
            socket.disconnect();
        });
    });
};
