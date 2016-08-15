'use strict';


const PARSERS = {
    'text': parseTextItem,
    'boolean': parseBooleanItem,
    'detailedProfileInformation': parseDetailedProfileInformation,
    'counters': parseCounters,
};

function parse(type, $, item) {
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

module.exports = parse;
