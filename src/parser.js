'use strict';


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

    console.error('No parser for type', type);
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
    const value = $(item.selector).attr(item.attribute).trim();
    return {
        key: item.name,
        value: value
    };
}

function parseDetailedProfileInformation($) {
    let data = {};
    $('.profile_info_block').each((i, el) => {
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

function parseContentCounters($) {
    let data = {};
    $('.header_top').each((i, el) => {
        let title = $(el).find('.header_label').text().trim();
        let content = $(el).find('.header_count').text().trim();
        if (data[title]) {
            console.error(`Conflicting data title <${title}>.\nExisting: ${data[title]}\nNew: ${content}`);
        }
        data[title] = content;
    });

    return data;
}
