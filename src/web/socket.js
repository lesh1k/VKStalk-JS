'use strict';

const cluster = require('cluster');
const helpers = require('./helpers');
const StalkedId = require('./models/stalked_id');
const User = require('./models/user');
const format = require('./format');
const CONFIG = require('../config/config.json');


module.exports = function(server) {
    const io = require('socket.io')(server);
    const workers = {}; // {stalked_id: worker_id}

    io.on('connection', (socket) => {
        prepopulateWorkers();

        const username = socket.request.user._doc.username;
        socket.emit('connection', {
            message: 'Connection established.'
        });
        socket.on('stalk-join', join);

        socket.on('stalk-start', stalked_id => {
            // console.log(`Stalk request from ${username}, target: ${stalked_id}`);
            StalkedId.findOne({
                sid: stalked_id
            }).then(sid_data => {
                User.findOne({
                    username: username
                }).then(user => {
                    if (user.stalkers_count >= CONFIG.max_workers_per_user) {
                        socket.emit('stalk-data', {
                            stalked_id: stalked_id,
                            message: `Limit of ${CONFIG.max_workers_per_user} running stalker(s) per user reached`,
                            error: 'Running stalkers per user limit reached.',
                            running: false
                        });
                        return;
                    }

                    if ((!sid_data || !sid_data.subscribers.length) && Object.keys(workers).length >= CONFIG.max_workers) {
                        socket.emit('stalk-data', {
                            stalked_id: stalked_id,
                            message: 'All workers are busy. Please try again later.',
                            error: 'All workers are busy.',
                            running: false
                        });
                        return;
                    }
                    if (sid_data.subscribers.indexOf(username) === -1) {
                        sid_data.subscribers.push(username);
                        StalkedId.update({
                            _id: sid_data._id
                        }, {
                            $set: {
                                subscribers: sid_data.subscribers
                            }
                        }, () => {
                            User.findOneAndUpdate({
                                username: username
                            }, {
                                $inc: {
                                    stalkers_count: 1
                                }
                            }, () => {});
                            join(stalked_id);
                        });


                    }
                });
            });
        });

        socket.on('stalk-stop', leave);
        socket.on('stalk-remove', (stalked_id) => {
            User.findOne({
                username: username
            }).then(user => {
                const stalked_ids = user.stalked_ids;
                const room = stalked_id;
                const index = stalked_ids.indexOf(stalked_id);

                if (index !== -1) {
                    stalked_ids.splice(index, 1);
                    User.findOneAndUpdate({
                        username: username
                    }, {
                        stalked_ids: stalked_ids
                    }, () => {
                        leave(room);
                        socket.emit('stalk-remove', {
                            error: null,
                            message: 'Success!',
                            stalked_id: stalked_id
                        });
                    });
                } else {
                    socket.emit('stalk-remove', {
                        error: 'This user ID does not exist.',
                        message: '',
                        stalked_id: stalked_id
                    });
                }
            });
        });

        function join(room) {
            const stalked_id = room;

            socket.emit('stalk-data', {
                stalked_id: stalked_id,
                message: 'Connecting...',
                running: true
            });
            StalkedId.findOneAndUpdate({
                sid: stalked_id
            }, {}, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }).then(sid_data => {
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
                        console.log('Creating new WORKER for', stalked_id);
                        const onMessage = msg => {
                            io.sockets.to(room).emit('stalk-data', {
                                stalked_id: stalked_id,
                                message: format('web', msg),
                                running: true
                            });
                        };
                        const args = ['stalk', stalked_id];
                        worker = helpers.spawnStalker(args, onMessage);
                        workers[stalked_id] = worker.id;
                    } else {
                        socket.emit('stalk-data', {
                            stalked_id: stalked_id,
                            message: 'Connected. Waiting for a message...',
                            is_reconnect: true,
                            running: true
                        });
                    }
                } else {
                    socket.emit('stalk-data', {
                        stalked_id: stalked_id,
                        message: 'Stalker offline. Click "STALK" to turn it on.',
                        running: false
                    });
                }
            });
        }

        function leave(room) {
            const stalked_id = room;
            socket.emit('stalk-data', {
                stalked_id: stalked_id,
                message: 'Disconnecting...',
                running: false
            });

            StalkedId.findOne({
                sid: stalked_id
            }).then(sid_data => {
                const index = sid_data.subscribers.indexOf(username);
                if (index === -1) {
                    console.error(`Username ${username} is not subscribed to updates from ${stalked_id}`);
                    return;
                }


                sid_data.subscribers.splice(index, 1);
                StalkedId.update({
                    _id: sid_data._id
                }, {
                    $set: {
                        subscribers: sid_data.subscribers
                    }
                }).then(() => {
                    User.findOneAndUpdate({
                        username: username
                    }, {
                        $inc: {
                            stalkers_count: -1
                        }
                    }, () => {});
                    console.log(`${username} is leaving room ${room}`);
                    socket.leave(room, err => {
                        if (err) {
                            console.log(err);
                        }
                    });

                    socket.emit('stalk-data', {
                        stalked_id: stalked_id,
                        message: 'Stalker offline. Click "STALK" to turn it on.',
                        running: false
                    });

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
            delete workers[stalked_id];
        }
    });

    return io;

    function prepopulateWorkers() {
        for (let k in cluster.workers) {
            const stalked_id = cluster.workers[k].stalked_id;
            if (stalked_id) {
                workers[stalked_id] = k;
            }
        }
    }
};
