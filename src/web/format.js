'use strict';

// const helpers = require('./helpers.js');


module.exports = format;

const FORMATTERS = {
    'web': formatWeb,
    'reportMusic': formatReportMusic,
    'reportGeneral': formatReportGeneral
};

function format(type) {
    const msg = arguments[1];
    if (msg.error) {
        return msg.error;
    }

    if (typeof msg.data === 'string') {
        return msg.data;
    }

    arguments[1] = msg.data;

    const formatter = FORMATTERS[type];
    if (typeof formatter === 'function') {
        let args = [].slice.call(arguments, 1);
        return formatter.apply(null, args);
    }

    console.error('No formatter for type', item.type);
}

function formatWeb(data) {
    let result = '';
    result += formatUserData(data.user, data.logs_written);
    if (data.updates) {
        result += formatUpdates(data.updates);
    }

    return result;
}

function formatUserData(data, logs_written = 0) {
    // let launch_date = helpers.getProcessLaunchDate();
    let name = data.Name.replace('  ', ' ');
    // let result = `App launched on ${launch_date}\n`;
    let result = '';
    result += `User name: ${name}\n`;
    result += `User ID: ${data.user_id}\n`;
    result += `Logs written: ${logs_written}\n\n`;
    result += `Checked on <span class="localize-datetime">${new Date(data.timestamp)}</span>\n\n`;
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

function formatReportMusic(docs) {
    if (!docs.length) {
        return 'No music tracks were found';
    }

    let table = new Table({
        head: ['#', 'Track', 'Times played']
    });

    docs.forEach((doc, i) => {
        table.push([i+1, doc.track, doc.play_count]);
    });

    return table.toString();
}

function formatReportGeneral(doc) {
    let result = '';
    for (let k in doc) {
        if (k === '_id') continue;
        result += `${k.trim().replace(':', '')}: ${doc[k]}\n`;
    }

    return result;
}
