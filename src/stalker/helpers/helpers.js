'use strict';

const logger = require('../logger.js');
const cluster = require('cluster');
const extend = require('extend');

module.exports = exports = {};

exports.getProcessLaunchDate = function() {
    logger.debug('Function call. getProcessLaunchDate()', {
        args: [].slice.call(arguments)
    });
    // The result is not absolutely precise.
    // Deviations of up to 2 seconds are to be expected
    const ms_in_second = 1000;
    const now = new Date().getTime();
    const uptime = process.uptime() * ms_in_second;
    return new Date(now - uptime);
};

exports.capitalize = function(str) {
    logger.debug('Function call. capitalize(str)', {
        args: [].slice.call(arguments)
    });
    if (!str.length || typeof str !== 'string') {
        return str;
    }

    str = str[0].toUpperCase() + str.substr(1);
    return str;
};

exports.convertTimeTo24hrs = function(time) {
    logger.debug('Function call. convertTimeTo24hrs(time)', {
        args: [].slice.call(arguments)
    });
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
    logger.debug('Function call. terminate(reason, message)', {
        args: [].slice.call(arguments)
    });
    logger.error('Manual call of process.exit()', {
        reason: reason,
        message: message
    });
    process.exit();
};

exports.sendData = function(message, fallback_to_console = false) {
    const message_sample = {
        type: null,
        data: null,
        report_type: null,
        error: null
    };

    const to_send = extend(true, message_sample, message);
    if (!isValidMessage(to_send)) {
        logger.error('Invalid message format', {
            message: to_send
        });
        setTimeout(() => {
            throw Error('stalker.helpers.sendData - Invalid message format');
        }, 2000);
        return;
    }

    if (cluster.isWorker) {
        logger.debug('Sending data to master, via process.send', {
            message: to_send
        });
        process.send(to_send);
    } else if (fallback_to_console) {
        logger.debug('Call to sendData(data) from the Master process. process.send not available, falling back to console.log');
        console.log(to_send);
    } else {
        let msg = 'Call to sendData(data) from the Master process.';
        msg += 'process.send not available, fallback to console.log forbidden. Nothing to do here';
        logger.debug(msg, {
            message: to_send
        });
    }
};

function isValidMessage(message) {
    const log_prefix = 'isValidMessage(message).';
    const MESSAGE_TYPES = ['object', 'stalk-data', 'report'];

    if (typeof message.data === 'string' || message.error) {
        return true;
    }

    if (MESSAGE_TYPES.indexOf(message.type) === -1) {
        logger.error(
            `${log_prefix} Unknown message.type "${message.type}"`, {
                message: message
            }
        );
        return false;
    }

    if (message.type !== 'error' && typeof message.data !== 'object') {
        logger.error(
            `${log_prefix} Unexpected message.data for message.type="${message.type}"` +
            `Expected message.data to be 'object', but it is '${typeof message.data}'`, {
                message: message
            }
        );
        return false;
    }

    if (message.type === 'report' && typeof message.report_type !== 'string') {
        logger.error(
            `${log_prefix} Missing or invalid message.report_type="${message.report_type}" for message.type="${message.type}"`, {
                message: message
            }
        );
        return false;
    }

    return true;
}

exports.datetimeRange = function(val) {
    logger.debug(`Parsing datetime range: ${val}`);

    if (val.indexOf('..') === -1) {
        logger.debug(`No ".." separator found. Considering it to be "from", appending "..". Input: ${val}`);
        val += '..';
    }
    const dates = val.split('..').map(part => new Date(part));
    const range = {};

    if (!Number.isNaN(dates[0].getTime())) {
        range.from = new Date(dates[0]);
    }

    if (!Number.isNaN(dates[1].getTime())) {
        range.to = new Date(dates[1]);
    } else {
        range.to = new Date();
    }

    if (!Object.keys(range).length) {
        const err_msg = `Invalid range format. Expected [from]..[to], got ${val}`;
        logger.error(err_msg);
        return Error(err_msg);
    }

    console.log(range);

    return range;
};
