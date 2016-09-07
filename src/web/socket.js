'use strict';

const cluster = require('cluster');
const path = require('path');
const StalkedId = require('./models/stalked_id');
const User = require('./models/user');


module.exports = function(server) {
    const io = require('socket.io')(server);
    const workers = {}; // {stalked_id: worker_id}

    io.on('connection', (socket) => {
        const username = socket.request.user._doc.username;
        socket.emit('connection', {message: 'Connection established.'});
        socket.on('stalk-join', join);

        socket.on('stalk-start', stalked_id => {
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

        socket.on('stalk-stop', leave);
        socket.on('stalk-remove', (stalked_id) => {
            User.findOne({username: username}).then(user => {
                const stalked_ids = user.stalked_ids;
                const room = stalked_id;
                const index = stalked_ids.indexOf(stalked_id);

                if (index !== -1) {
                    stalked_ids.splice(index, 1);
                    User.findOneAndUpdate({username: username}, {stalked_ids: stalked_ids}, () => {
                        leave(room);
                        socket.emit('stalk-remove', {error: null, message: 'Success!', stalked_id: stalked_id});
                    });
                } else {
                    socket.emit('stalk-remove', {error: 'This user ID does not exist.', message: '', stalked_id: stalked_id});
                }
            });
        });

        function join(room) {
            const stalked_id = room;

            socket.emit('stalk-data', {stalked_id: stalked_id, message:'Connecting...'});
            StalkedId.findOneAndUpdate({sid: stalked_id}, {}, {upsert: true, new: true, setDefaultsOnInsert: true }).then(sid_data => {
                if (sid_data.subscribers.indexOf(username) !== -1) {
                    console.log(`${username} is joining room ${room}`);
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

        function leave(room) {
            const stalked_id = room;
            socket.emit('stalk-data', {stalked_id: stalked_id, message:'Disconnecting...'});

            StalkedId.findOne({sid: stalked_id}).then(sid_data => {
                const index = sid_data.subscribers.indexOf(username);
                if (index === -1) {
                    console.error(`Username ${username} is not subscribed to updates from ${stalked_id}`);
                    return;
                }


                sid_data.subscribers.splice(index, 1);
                StalkedId.update({_id: sid_data._id}, {$set: {subscribers: sid_data.subscribers}}).then(() => {
                    console.log(`${username} is leaving room ${room}`);
                    socket.leave(room, err => {
                        if (err) {
                            console.log(err);
                        }
                    });

                    socket.emit('stalk-data', {stalked_id: stalked_id, message: 'Stalker offline. Click "STALK" to turn it on.'});

                    if (!sid_data.subscribers.length) {
                        killStalker(stalked_id);
                    }
                });
            });
        }

        function killStalker(stalked_id) {
            const worker_id = workers[stalked_id];
            if (!worker_id) {
                console.error(`Worker (ID=${worker_id}) stalking ${stalked_id} does not exist.`);
                return;
            }

            cluster.workers[worker_id].kill();
        }
    });

    return io;
};
