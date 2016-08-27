'use strict';

const co = require('co');
const cheerio = require('cheerio');

const ph = require('./helpers/phantom.js');
const db = require('./db.js');
const parse = require('./parser.js');
const format = require('./format.js');
const helpers = require('./helpers/helpers.js');
const db_helpers = require('./helpers/db_helpers.js');
const logger = require('./logger.js');

const CONFIG = require('./config/config.json');
const collection = db.get('data');
let USER_ID = null;
let logs_written = 0;
let retry_count = 0;
let URL;
let instance;

module.exports = exports = {};

exports.work = function(user_id) {
    if (!user_id) {
        throw Error('No user ID supplied.');
    }

    USER_ID = user_id;
    URL = CONFIG.url + USER_ID;
    scrape();
};


function scrape() {
    logger.debug('Function call. scrape()', {args: [].slice.call(arguments)});
    logger.info('Start scraping', {user_id: USER_ID});
    co(function*() {
        logger.info('Fetch HTML', {user_id: USER_ID});
        const html = yield * getPageContent(URL);
        const $ = cheerio.load(html);
        if (!isUserPageOpen($)) {
            logger.error('Cannot scrape page. !isUserPageOpen($) == true', {user_id: USER_ID, url: URL});
            logger.info('Scrape round skipped. Retry after timeout', {user_id: USER_ID});
            helpers.clearConsole();

            let message = '';
            message += `Attempt #${++retry_count}\n`;
            message += 'Cannot scrape page.';
            message += 'Profile is either hidden, not existing or deleted\n';
            message += `Please check that USER_ID=${USER_ID} and URL=${URL} are correct.\n`;
            message += 'Retry after timeout.';

            console.log(message);
            return;
            // helpers.terminate('Cannot scrape page', 'Profile is either hidden, not existing or deleted');
        }
        retry_count = 0;

        logger.info('Extract user data from fetched HTML', {user_id: USER_ID});
        const user_data = collectUserData($);

        logger.info('Check if new data has updates', {user_id: USER_ID, new_user_data: user_data});
        const user_updates = yield * checkUserDataForUpdates(user_data);
        if (user_updates) {
            logger.info('Write user data to DB', {user_id: USER_ID, data: user_data, updates: user_updates});
            yield collection.insert(user_data);
            logs_written++;
        }

        logger.info('Format data for console output', {user_id: USER_ID, data: user_data});
        const formatted_data = prepareConsoleOutput(user_data, user_updates);
        helpers.clearConsole();
        logger.debug('Write formatted data to console', {user_id: USER_ID, formatted_data: formatted_data});
        process.stdout.write(formatted_data);
    })
    .then(() => {
        const timeout = CONFIG.interval * 1000;
        logger.debug('Set timeout for next scrape() call.', {user_id: USER_ID, timeout: timeout});
        if (retry_count) {
            console.log(`Timeout ${timeout / 1000} seconds`);
        }
        setTimeout(scrape, timeout);
    })
    .catch(err => {
        logger.error('Caught exception in scrape()', {user_id: USER_ID, exception: err});
        console.log(err);
    });
}

function* getPageContent(url) {
    if (!instance) {
        instance = yield * ph.initPhantomInstance();
    }
    console.log('\nFetching data...');
    const html = yield * ph.fetchPageContent(url, instance, false);

    return html;
}

function isUserPageOpen($) {
    const is_hidden_or_deleted = ($ => {
        if ($('#page_current_info').length === 0 || $('.profile_deleted_text').length > 0) {
            return true;
        }

        return false;
    })($);

    if ($('#profile').length > 0 && !is_hidden_or_deleted) {
        return true;
    }

    return false;
}

function collectUserData($) {
    const data = {
        user_id: USER_ID,
        timestamp: new Date()
    };

    CONFIG.parse_map.forEach(item => {
        const parsed = parse(item.type, $, item);
        data[parsed.key] = parsed.value;
    });

    const detailed_info = parse('detailedProfileInformation', $);
    const counters = parse('counters', $);
    const content_counters = parse('contentCounters', $);
    Object.assign(data, detailed_info, counters, content_counters);
    data['Last seen'] = format('lastSeenTime', data['Last seen']);

    return data;
}

function* checkUserDataForUpdates(data) {
    let count = yield collection.count({
        user_id: USER_ID
    });

    if (!count) {
        // No entries for this USER_ID yet
        return data;
    }

    const last_document = yield * db_helpers.getLastUserDocument(collection, USER_ID);
    const updates = getDiff(last_document, data);

    return updates;
}

function getDiff(last_document, data) {
    let updates = {};

    let excluded = CONFIG.keys_to_exclude_when_looking_for_updates.concat(['timestamp']);
    let keys = Object.keys(data).filter(k => excluded.indexOf(k) === -1);
    for (let k of keys) {
        if (data[k] !== last_document[k]) {
            updates[k] = {
                old: last_document[k],
                current: data[k]
            };
        }
    }

    filterUpdates(updates);
    if (Object.keys(updates).length) {
        return updates;
    }

    return null;
}

function filterUpdates(updates) {
    CONFIG.keys_to_hide_from_updates.forEach(k => delete updates[k]);
}

function prepareConsoleOutput(data, updates) {
    let formatted_data = format('dataForConsole', data, logs_written);
    if (updates && updates !== data) {
        formatted_data += format('updatesForConsole', updates);
    }

    return formatted_data;
}
