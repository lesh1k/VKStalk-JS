'use strict';

const helpers = require('./helpers/helpers.js');


const FORMATTERS = {
    'dataForConsole': formatForConsole,
    'updatesForConsole': formatUpdates
};

function format(purpose, data) {
    const formatter = FORMATTERS[purpose];
    if (typeof formatter === 'function') {
        let args = [].slice.call(arguments, 1);
        return formatter.apply(null, args);
    }

    console.error('No formatter for type', item.type);
}

function formatForConsole(data) {
    let launch_date = helpers.getProcessLaunchDate();
    let name = data.Name.split(' ').map(s => s.trim()).join(' ');
    let result = `App launched on ${launch_date}\n`;
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

function formatUpdates(updates) {
    let result = '\nUPDATES\n';
    for (let k in updates) {
        result += `${k}: ${updates[k].current}\n`;
    }

    return result;
}

module.exports = format;
