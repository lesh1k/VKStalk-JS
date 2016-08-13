'use strict';

const co = require('co');
const fs = require('fs');
const cheerio = require('cheerio');

const LAUNCH_DATE = new Date();
const CONFIG = require('./config/config.json');
const ph = require('./phantom_helpers.js');
const db = require('./db.js');
const collection = db.get('data');

scrape();
setInterval(scrape, CONFIG.interval * 1000);

function scrape() {
    co(function*() {
        console.log('Fetching data...');
        // const instance = yield * ph.initPhantomInstance();
        const url = CONFIG.url + CONFIG.user_id;
        const html = yield * ph.fetchPageContent(url, undefined, false);
        const $ = cheerio.load(html);
        const data = {
            user_id: CONFIG.user_id,
            timestamp: new Date()
        };
        CONFIG.parse_map.forEach(item => {
            const parsed = parseItem($, item);
            data[parsed.key] = parsed.value;
        });
        const detailed_info = parseDetailedProfileInformation($);
        const counters = parseCounters($);
        Object.assign(data, detailed_info, counters);

        fs.writeFileSync(`../logs/${CONFIG.user_id}.json`, JSON.stringify(data));
        collection.insert(data);

        clearConsole();
        const formatted_data = format(data, 'console');
        console.log(formatted_data);
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
    let result = `App launched on ${LAUNCH_DATE}\n`;
    result += `User name: ${data.Name}\n`;
    result += `User ID: ${data.user_id}\n\n`;
    result += `>>> Checked on ${data.timestamp} <<<\n\n`;
    result += `${data.Name} -- ${data['Last seen']}`;
    if (data.isFromMobile) {
        result += ' [Mobile]';
    }
    result += '\n';
    result += `Current status: ${data['Current status']}\n`;

    return result;
}
