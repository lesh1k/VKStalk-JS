'use strict';

const logger = require('../logger.js');
const memwatch = require('memwatch-next');
const cluster = require('cluster');

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

exports.convertTimeTo24hrs = function(time) {
    logger.debug('Function call. convertTimeTo24hrs(time)', {args: [].slice.call(arguments)});
    let parts = time.split(' ');
    let hours = parts[0].split(':')[0];
    let minutes = parts[0].split(':')[1];
    let period = parts[1];

    if (period === 'am') {
        if (hours.length === 1) {
            hours = '0' + hours;
        } else if (hours === '12') {
            hours = '00';
        }
    } else {
        if (hours !== '12') {
            hours = String(parseInt(hours, 10) + 12);
        }
    }

    return `${hours}:${minutes}`;
};

exports.terminate = function(reason, message) {
    logger.debug('Function call. terminate(reason, message)', {args: [].slice.call(arguments)});
    logger.error('Manual call of process.exit()', {reason: reason, message: message});
    console.log(`\n\nProcess exited\nReason: ${reason}\nMessage: ${message}`);
    process.exit();
};

exports.monitorMemoryLeaks = function() {
    memwatch.on('leak', function(info) {
        logger.warn('Possible MEMORY LEAK detected', info);
    });
};

exports.sendData = function(data) {
    if (cluster.isWorker) {
        logger.debug('Sending data to master, via process.send', {data: data});
        process.send(data);
    } else {
        logger.info('Call to sendData(data) from the Master process. process.send not availailable, falling back to console.log');
        console.log(data);
    }
};
