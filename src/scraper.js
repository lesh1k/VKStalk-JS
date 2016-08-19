'use strict';

const co = require('co');
const cheerio = require('cheerio');

const ph = require('./helpers/phantom.js');
const db = require('./db.js');
const parse = require('./parser.js');
const format = require('./format.js');
const helpers = require('./helpers/helpers.js');
const db_helpers = require('./helpers/db_helpers.js');

const CONFIG = require('./config/config.json');
const collection = db.get('data');
let USER_ID = null;
let logs_written = 0;
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
    co(function*() {
        const start_time = new Date();
        const html = yield * getPageContent(URL);
        const $ = cheerio.load(html);
        if (!isUserPageOpen($)) {
            helpers.terminate('Cannot scrape page', 'Profile is either hidden, not existing or deleted');
        }
        const user_data = collectUserData($);

        const user_updates = yield * checkUserDataForUpdates(user_data);
        if (user_updates) {
            yield collection.insert(user_data);
            logs_written++;
        }

        const formatted_data = prepareConsoleOutput(user_data, user_updates);
        helpers.clearConsole();
        process.stdout.write(formatted_data);

        const end_time = new Date();
        const timeout_correction = end_time - start_time;
        return timeout_correction;
    })
    .then(timeout_correction => {
        const timeout = CONFIG.interval * 1000 - timeout_correction;
        setTimeout(scrape, timeout);
    })
    .catch(err => {
        console.log(err);
    });
}

function* getPageContent(url) {
    if (!instance) {
        instance = yield * ph.initPhantomInstance();
    }
    process.stdout.write('\nFetching data...');
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
