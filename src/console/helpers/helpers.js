'use strict';

const memwatch = require('memwatch-next');
const cluster = require('cluster');
const path = require('path');

const logger = require('../logger.js');

module.exports = exports = {};

exports.clearConsole = function() {
    logger.debug('Function call. clearConsole()', {args: [].slice.call(arguments)});
    // console.log('\x1Bc');
    process.stdout.write('\x1Bc');
};

exports.getProcessLaunchDate = function() {
    logger.debug('Function call. getProcessLaunchDate()', {args: [].slice.call(arguments)});
    // The result is not absolutely precise.
    // Deviations of up to 2 seconds are to be expected
    const ms_in_second = 1000;
    const now = new Date().getTime();
    const uptime = process.uptime() * ms_in_second;
    return new Date(now - uptime);
};

exports.capitalize = function(str) {
    logger.debug('Function call. capitalize(str)', {args: [].slice.call(arguments)});
    if (!str.length || typeof str !== 'string') {
        return str;
    }

    str = str[0].toUpperCase() + str.substr(1);
    return str;
};

exports.monitorMemoryLeaks = function() {
    memwatch.on('leak', function(info) {
        logger.warn('Possible MEMORY LEAK detected', info);
    });
};

exports.spawnStalker = function(args, onMessage, onError=console.error) {
    cluster.setupMaster({
        exec: path.resolve(__dirname, '../../stalker/run'),
        args: args,
        silent: true
    });

    const worker = cluster.fork();
    worker.on('message', onMessage);
    worker.on('error', onError);
};
