'use strict';

const cluster = require('cluster');
const path = require('path');


module.exports = function(server) {
    const socket_io = require('socket.io')(server);
    socket_io.on('connection', (socket) => {
        socket.emit('stalk-data', 'Connecting...');
        socket.emit('connection', 'Done!');

        socket.on('stalk-request', user_id => {
            cluster.setupMaster({
                exec: path.resolve(__dirname, '../vkstalk'),
                args: ['stalk', user_id],
                silent: true
            });

            let worker = cluster.fork();
            worker.process.stdout.on('data', buffer => {
                socket.emit('stalk-data', buffer.toString('utf8'));
            });
            socket.emit('stalk-data', user_id);
        });
    });
};
