'use strict';

const co = require('co');
const fs = require('fs');
const cheerio = require('cheerio');

const CONFIG = require('./config.json');
const ph = require('./phantom_helpers.js');

co(function*() {
    // const instance = yield * ph.initPhantomInstance();
    const url = CONFIG.url + CONFIG.user_id;
    const html = yield * ph.fetchPageContent(url, undefined, false);
    const $ = cheerio.load(html);
    let text = CONFIG.parse_map.map(parseItem.bind(null, $)).join('\n') + '\n';
    text += parseDetailedProfileInformation($);
    text += parseCounters($);

    fs.writeFileSync(`${CONFIG.user_id}.txt`, text);
});

function parseItem($, item) {
    let result = '';
    switch (item.type) {
    case 'text':
        result = parseTextItem($, item);
        break;
    case 'boolean':
        result = parseBooleanItem($, item);
        break;
    default:
        console.log('No parser for type', item.type);

    }

    return result;
}

function parseTextItem($, item) {
    const text = $(item.selector).text();
    return `${item.name}: ${text}`;
}

function parseBooleanItem($, item) {
    let text = $(item.selector).length > 0;
    return `${item.name}: ${text}`;
}

function parseDetailedProfileInformation($) {
    let text = '';
    $('.profile_info_block').each((i, el) => {
        text += $(el).find('profile_info_header').text() + '\n';
        $(el).find('.profile_info_row').each((i, el) => {
            let title = $(el).find('.label').text();
            let content = $(el).find('.labeled').text();
            text += `${title} ${content}\n`;
        });
    });

    return text;
}

function parseCounters($) {
    let text = '';
    $('.counts_module .page_counter').each((i, el) => {
        let title = $(el).find('.label').text();
        let content = $(el).find('.count').text();
        text += `${title}: ${content}\n`;
    });

    return text;
}
