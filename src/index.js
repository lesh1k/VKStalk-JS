'use strict';

const co = require('co');
const fs = require('fs');
const cheerio = require('cheerio');

const LAUNCH_DATE = new Date();
const CONFIG = require('./config/config.json');
const ph = require('./phantom_helpers.js');
const db = require('./db.js');
const collection = db.get('data');
const USER_ID = process.argv[2];
let instance;

if (!USER_ID) {
    throw Error('No user ID supplied.');
}

scrape();
setInterval(scrape, CONFIG.interval * 1000);

function scrape() {
    co(function*() {
        try{

            if (!instance) {
                instance = yield * ph.initPhantomInstance();
            }
            console.log('Fetching data...');
            const timestamp = new Date();
            const url = CONFIG.url + USER_ID;
            const html = yield * ph.fetchPageContent(url, instance, false);
            const $ = cheerio.load(html);
            const data = {
                user_id: USER_ID,
                timestamp: timestamp
            };
            CONFIG.parse_map.forEach(item => {
                const parsed = parseItem($, item);
                data[parsed.key] = parsed.value;
            });
            const detailed_info = parseDetailedProfileInformation($);
            const counters = parseCounters($);
            Object.assign(data, detailed_info, counters);

            fs.writeFileSync(`../logs/${USER_ID}.json`, JSON.stringify(data));

            let updates = yield * getDiff(data);
            if (updates) {
                console.log('THERE ARE UPDATES!');
                yield collection.insert(data);
            }

            // clearConsole();
            let formatted_data = format(data, 'console');
            if (updates && updates !== data) {
                formatted_data += formatUpdates(updates);
            }
            console.log(formatted_data);
        } catch(err) {
            console.log(err);
        }
    });
}

function parseItem($, item) {
    let result = {};
    switch (item.type) {
        case 'text':
            result = parseTextItem($, item);
            break;
        case 'boolean':
            result = parseBooleanItem($, item);
            break;
        default:
            console.error('No parser for type', item.type);

    }

    return result;
}

function parseTextItem($, item) {
    const text = $(item.selector).text().trim();
    return {
        key: item.name,
        value: text
    };
}

function parseBooleanItem($, item) {
    let text = $(item.selector).length > 0;
    return {
        key: item.name,
        value: text
    };
}

function parseDetailedProfileInformation($) {
    let data = {};
    $('.profile_info_block').each((i, el) => {
        // text += $(el).find('profile_info_header').text() + '\n';
        $(el).find('.profile_info_row').each((i, el) => {
            let title = $(el).find('.label').text();
            let content = $(el).find('.labeled').text();
            if (data[title]) {
                console.error(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`);
            }
            data[title] = content;
        });
    });

    return data;
}

function parseCounters($) {
    let data = {};
    $('.counts_module .page_counter').each((i, el) => {
        let title = $(el).find('.label').text();
        let content = $(el).find('.count').text();
        if (data[title]) {
            console.error(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`);
        }
        data[title] = content;
    });

    return data;
}

function clearConsole() {
    // console.log('\x1Bc');
    process.stdout.write('\x1Bc');
}

function format(data, purpose) {
    let result = '';
    switch (purpose) {
    case 'console':
        result = formatForConsole(data);
        break;
    default:
        console.error('No parser for type', item.type);
        break;
    }

    return result;
}

function formatForConsole(data) {
    let name = data.Name.split(' ').map(s => s.trim()).join(' ');
    let result = `App launched on ${LAUNCH_DATE}\n`;
    result += `User name: ${name}\n`;
    result += `User ID: ${data.user_id}\n\n`;
    result += `>>> Checked on ${data.timestamp} <<<\n\n`;
    result += `${name} -- ${data['Last seen']}`;
    if (data.isFromMobile) {
        result += ' [Mobile]';
    }
    result += '\n';
    result += `Current status: ${data['Current status']}\n`;

    return result;
}

function* getDiff(data) {
    let updates = null;
    let count = yield collection.count({user_id: USER_ID});
    console.log(count);
    if (!count) {
        // No entries for this USER_ID yet
        console.log('FUCKING got here');
        return data;
    }
    let cursor = yield collection.find({user_id: USER_ID}, {rawCursor: true});
    let last_document = yield cursor.sort([['timestamp', -1]]).limit(1).toArray();
    last_document = last_document[0];
    let keys = Object.keys(data).filter(k => ['timestamp', 'Last seen'].indexOf(k) === -1);
    for (let k of keys) {
        if (data[k] !== last_document[k]) {
            if (!updates) {
                updates = {};
            }
            updates[k] = {
                old: last_document[k],
                current: data[k]
            };
        }
    }

    return updates;
}

function formatUpdates(updates) {
    let result = '\nUPDATES\n';
    for (let k in updates) {
        result += `${k}: ${updates[k].current}\n`;
    }

    return result;
}
