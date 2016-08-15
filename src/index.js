'use strict';

const co = require('co');
const cheerio = require('cheerio');

const LAUNCH_DATE = new Date();
const ph = require('./helpers/phantom.js');
const db = require('./db.js');
const parse = require('./parser.js');
const format = require('./format.js');
const helpers = require('./helpers/helpers.js');

const CONFIG = require('./config/config.json');
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
                const parsed = parse(item.type, $, item);
                data[parsed.key] = parsed.value;
            });
            const detailed_info = parse('detailedProfileInformation', $);
            const counters = parse('counters', $);
            Object.assign(data, detailed_info, counters);

            let updates = yield * getDiff(data);
            if (updates) {
                console.log('THERE ARE UPDATES!');
                yield collection.insert(data);
                console.log('UPDATES were inserted in DB!');
            }

            helpers.clearConsole();
            let formatted_data = format('dataForConsole', data);
            if (updates && updates !== data) {
                formatted_data += format('updatesForConsole', updates);
            }
            console.log(formatted_data);
        } catch(err) {
            console.log(err);
        }
    });
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
