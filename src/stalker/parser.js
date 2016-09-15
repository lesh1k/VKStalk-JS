'use strict';

const logger = require('./logger.js');


module.exports = parse;

const PARSERS = {
    'text': parseTextItem,
    'boolean': parseBooleanItem,
    'attribute': parseAttributeItem,
    'detailedProfileInformation': parseDetailedProfileInformation,
    'counters': parseCounters,
    'contentCounters': parseContentCounters
};


function parse(type) {
    const parser = PARSERS[type];
    if (typeof parser === 'function') {
        let args = [].slice.call(arguments, 1);
        return parser.apply(null, args);
    }

    logger.error(`Bad config.json. No parser for type=${type}`, {type: type});
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

function parseAttributeItem($, item) {
    let value = $(item.selector).attr(item.attribute);
    if (typeof value !== 'string') {
        logger.warn('parseAttributeItem. attr/value is not string', {item: item, value: value});
        value = '';
    }

    return {
        key: item.name,
        value: value.trim()
    };
}

function parseDetailedProfileInformation($) {
    let data = {};
    $('.profile_info_short, .profile_info_full .profile_info_block').each((i, el) => {
        $(el).find('.profile_info_row').each((i, el) => {
            let title = $(el).find('.label').text().replace('.', ' ').replace(':', '');
            let content = $(el).find('.labeled').text();
            if (data[title] && data[title] !== content) {
                logger.warn(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`, {user_id: data.user_id});
            }
            data[title] = content;
        });
    });

    return data;
}

function parseCounters($) {
    let data = {};
    $('.counts_module .page_counter').each((i, el) => {
        let title = $(el).find('.label').text().replace('.', ' ').replace(':', '');
        let content = $(el).find('.count').text();
        if (data[title] && data[title] !== content) {
            logger.warn(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`, {user_id: data.user_id});
        }
        data[title] = content;
    });

    return data;
}

function parseContentCounters($) {
    let data = {};
    $('.header_top').each((i, el) => {
        let title = $(el).find('.header_label').text().trim();
        let content = $(el).find('.header_count').text().trim();
        if (data[title]) {
            logger.warn(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`, {user_id: data.user_id});
        }
        data[title] = content;
    });

    return data;
}
