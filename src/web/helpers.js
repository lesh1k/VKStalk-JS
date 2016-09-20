'use strict';

const cluster = require('cluster');
const path = require('path');

module.exports = exports = {};

exports.isValidId = function(id) {
    const regex = /^[\w.\-]{1,}$/i;
    return regex.test(id);
};

exports.spawnStalker = function(args, onMessage, onError=console.error) {
    cluster.setupMaster({
        exec: path.resolve(__dirname, '../stalker/run'),
        args: args,
        silent: true
    });

    const worker = cluster.fork();
    worker.on('message', onMessageThunkify(onMessage));
    worker.on('error', onError);

    return worker;
};

function onMessageThunkify(fn) {
    return msg => {
        if (typeof msg.data === 'string') {
            // console.log(msg.data);
        }

        if (msg.error) {
            console.log(msg.error);
        }

        return fn(msg);
    };
}

exports.isSanitized = str => {
    const regex = /^(\w|\s|\.|\:|\-)*$/im;
    return regex.test(str);
};
