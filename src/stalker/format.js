'use strict';

const Table = require('cli-table');
const helpers = require('./helpers/helpers.js');
const logger = require('./logger');


module.exports = format;

const FORMATTERS = {
    'lastSeenTime': formatLastSeenTime,
    'retryConnectionMessage': formatRetryConnectionMessage
};

function format(type) {
    const formatter = FORMATTERS[type];
    if (typeof formatter === 'function') {
        let args = [].slice.call(arguments, 1);
        return formatter.apply(null, args);
    }

    logger.error('No formatter for type', type);
}

function formatLastSeenTime(last_seen) {
    const regex = /\d{1,2}\:\d{2}\s{1}(am|pm){1}/i;
    if (regex.test(last_seen)) {
        let time = last_seen.match(regex)[0];
        time = helpers.convertTimeTo24hrs(time);
        last_seen = last_seen.replace(regex, time);
    }

    return last_seen;
}

function formatRetryConnectionMessage(retry_count, max_retry_attempts, user_id, url, timeout) {
    let message = '';
    message += `Attempt #${retry_count} (out of ${max_retry_attempts})\n`;
    message += 'Cannot scrape page.';
    message += 'Profile is either hidden, not existing or deleted\n';
    message += `Please check that USER_ID=${user_id} and URL=${url} are correct.\n`;
    message += `Retry after timeout (${timeout / 1000} seconds)`;

    return message;
}
