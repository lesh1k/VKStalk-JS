'use strict';

const co = require('co');
const cheerio = require('cheerio');
const async_lib = require('async');

const ph = require('./helpers/phantom.js');
const db = require('./db.js');
const parse = require('./parser.js');
const format = require('./format.js');
const helpers = require('./helpers/helpers.js');
const logger = require('./logger.js');

const CONFIG = require('../config/config.json');
const Data = db.get('data');
const DataUpdates = db.get('data_updates');
let USER_ID = null;
let logs_written = 0;
let retry_count = 0;
let URL;
let instance;
let instance_respawn;

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
    logger.info('Start scraping', {
        user_id: USER_ID
    });

    async_lib.auto({
        url: async_lib.constant(URL),
        html: ['url', getPageContent],
        $: ['html', async_lib.asyncify(loadHtml)],
        user_data: ['$', async_lib.asyncify(collectUserData)],
        prev_user_data: getPreviousUserData,
        user_updates: ['user_data', 'prev_user_data', checkUserDataForUpdates],
        store_user_updates: ['user_data', 'user_updates', 'prev_user_data', storeUserUpdates],
        store_user_data: ['user_data', 'user_updates', 'prev_user_data', storeUserData],
        send_data: ['user_data', 'user_updates', 'store_user_data', sendData]
    }, 1, (err, results) => {
        if (err) {
            handleScrapeError(err);
        } else {
            next();
            logger.debug('Scrape done!');
        }
    });
}

function getPreviousUserData(callback) {
    Data.findOne({user_id: USER_ID}, {sort: {timestamp: -1}})
        .then(doc => {
            callback(null, doc);
        })
        .catch(callback);
}

function storeUserUpdates(results, callback) {
    const {user_updates, prev_user_data, user_data} = results;
    if (user_updates && typeof user_updates === 'object' && prev_user_data) {
        const doc = {
            user_id: USER_ID,
            updates: user_updates,
            timestamp: user_data.timestamp
        };
        logger.info('Write user updates to DB', {
            doc: doc
        });
        DataUpdates.insert(doc, () => {
            callback(null, true);
        });
    } else {
        callback(null, false);
    }
}

function storeUserData(results, callback) {
    const {user_updates, user_data} = results;
    if (user_updates) {
        logger.info('Write user data to DB', {
            user_id: USER_ID,
            data: user_data
        });

        Data.insert(user_data, () => {
            logs_written++;
            callback(null, true);
        });
    } else {
        callback(null, false);
    }
}

function sendData({user_updates, user_data}, callback) {
    helpers.sendData({
        type: 'stalk-data',
        data: {
            user: user_data,
            updates: user_updates,
            logs_written: logs_written
        }
    });

    callback(null, true);
}

function handleScrapeError(err) {
    if (err.retry) {
        retry_count++;
        retryScrape();
        return;
    }

    logger.error(err);
    helpers.sendData({
        error: '[CRITICAL ERROR] The process will terminate now. For more info see the logs. Try restarting the stalker.'
    });
    setTimeout(() => {
        throw err;
    }, 2000);
}

function retryScrape() {
    logger.error('Cannot scrape page. isUserPageOpen($) == false', {
        user_id: USER_ID,
        url: URL
    });

    const timeout = CONFIG.interval * 1000;
    const message = format('retryConnectionMessage', retry_count, CONFIG.max_retry_attempts, USER_ID, URL, timeout);
    logger.warn(message);
    helpers.sendData({
        error: message
    });

    if (retry_count >= CONFIG.max_retry_attempts) {
        helpers.terminate('Max retry attempts reached.', `Failed ${retry_count} of ${CONFIG.max_retry_attempts} attempts.`);
    }

    setTimeout(scrape, timeout);
}

function next() {
    retry_count = 0;
    const timeout = CONFIG.interval * 1000;
    setTimeout(scrape, timeout);
}

function loadHtml({html}) {
    const $ = cheerio.load(html);
    return $;
}

function getPageContent({url}, callback) {
    async_lib.auto({
        instance: getPhantomInstance,
        html: ['instance', getHtml]
    }, (err, results) => {
        callback(err, results.html);
    });
}

function getPhantomInstance(callback) {
    if (!instance || new Date().getTime() > instance_respawn) {
        if (instance_respawn) {
            logger.info('Exiting phantom instance before respawn', {
                user_id: USER_ID
            });
            instance.exit();
        }

        logger.debug('Yield new phantom instance', {
            user_id: USER_ID
        });

        co(ph.initPhantomInstance)
            .then(ph_instance => {
                instance_respawn = new Date().getTime() + CONFIG.phantom_respawn_interval;
                logger.debug(`Set respawn phantom time to ${new Date(instance_respawn)}`, {
                    user_id: USER_ID,
                    respawn: new Date(instance_respawn)
                });
                instance = ph_instance;
                callback(null, ph_instance);
            });
    } else {
        callback(null, instance);
    }
}

function getHtml({instance}, callback) {
    const msg = 'Fetching HTML.';
    logger.info(msg);
    helpers.sendData({
        data: msg
    });

    co(ph.fetchPageContent.bind(null, URL, instance, false))
        .then(html => {
            callback(null, html);
        });
}

function isUserPageOpen($) {
    const is_hidden_or_deleted = $('#page_current_info, .profile_online').length === 0 || $('.profile_deleted_text').length > 0;
    const has_profile_info = $('#profile').length > 0;
    const is_page_open = has_profile_info && !is_hidden_or_deleted;

    return is_page_open;
}

function collectUserData({$}) {
    if (!isUserPageOpen($)) {
        throw {
            message: 'User page closed, hidden or does not exist',
            retry: true
        };
    }

    logger.info('Extract user data from fetched HTML', {
        user_id: USER_ID
    });
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

function checkUserDataForUpdates({user_data, prev_user_data}, callback) {
    logger.info('Check if new data has updates', {
        user_id: USER_ID
    });

    if (!prev_user_data) {
        logger.debug('Skip check for updates. No previous data for this user is available.');
        // No entries for this USER_ID yet
        return 'First DB entry for user. Congrats!';
    }

    const updates = getDiff(prev_user_data, user_data);

    logger.debug('Updates:', {
        updates: updates
    });
    callback(null, updates);
}

function getDiff(last_document, data) {
    let updates = {};

    let excluded = ['Last seen', 'timestamp'];
    let keys = Object.keys(data).filter(k => excluded.indexOf(k) === -1);
    for (let k of keys) {
        if (data[k] !== last_document[k]) {
            updates[k] = {
                old: last_document[k],
                current: data[k]
            };
        }
    }

    if (Object.keys(updates).length) {
        return updates;
    }

    return null;
}
