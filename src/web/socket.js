'use strict';

const cluster = require('cluster');
const path = require('path');
const StalkedId = require('./models/stalked_id');


module.exports = function(server) {
    const io = require('socket.io')(server);
    const workers = {}; // {stalked_id: worker_id}

    io.on('connection', (socket) => {
        const username = socket.request.user._doc.username;
        socket.emit('connection', {message: 'Connection established.'});
        socket.on('join-room', join);

        socket.on('stalk-request', stalked_id => {
            // console.log(`Stalk request from ${username}, target: ${stalked_id}`);
            StalkedId.findOne({sid: stalked_id}).then(sid_data => {
                if (sid_data.subscribers.indexOf(username) === -1) {
                    sid_data.subscribers.push(username);
                    StalkedId.update({_id: sid_data._id}, {$set: {subscribers: sid_data.subscribers}}, () => {
                        join(stalked_id);
                    });
                }
            });
        });

        // socket.on('disconnect', () => {
        //     Object.keys(cluster.workers).forEach(id => cluster.workers[id].kill());
        // });

        socket.on('stalk-stop', stalked_id => {
            // console.log(io.nsps['/'].adapter.rooms);
            // console.log(socket.rooms);
            const room = io.nsps['/'].adapter.rooms[stalked_id];

            debugger
            // const worker_id = workers[stalked_id];
            // cluster.workers[worker_id].kill();
            // socket.disconnect();
        });

        function join(room) {
            const stalked_id = room;

            socket.emit('stalk-data', {stalked_id: stalked_id, message:'Connecting...'});
            StalkedId.findOneAndUpdate({sid: stalked_id}, {}, {upsert: true, new: true, setDefaultsOnInsert: true }).then(sid_data => {
                if (sid_data.subscribers.indexOf(username) !== -1) {
                    console.log(`Joining room ${room}`);
                    socket.join(room, err => {
                        if (err) {
                            console.log(err);
                        }
                    });
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
                        worker.process.stdout.on('data', buffer => {
                            io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message: buffer.toString('utf8')});
                        });
                    } else {
                        io.sockets.to(room).emit('stalk-data', {stalked_id: stalked_id, message:'Connected. Waiting for a message...'});
                    }
                } else {
                    socket.emit('stalk-data', {stalked_id: stalked_id, message: 'Stalker offline. Click "STALK" to turn it on.'});
                }
            });
        }
    });

    return io;
};
