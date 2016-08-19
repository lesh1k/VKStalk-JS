'use strict';

const helpers = require('./helpers/helpers.js');
const Table = require('cli-table');


module.exports = format;

const FORMATTERS = {
    'dataForConsole': formatForConsole,
    'updatesForConsole': formatUpdates,
    'reportMusic': formatReportMusic,
    'reportGeneral': formatReportGeneral
};

function format(type) {
    const formatter = FORMATTERS[type];
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

function formatReportMusic(docs) {
    if (!docs.length) {
        return 'No music tracks were found';
    }

    let table = new Table({
        head: ['Track', 'Times played']
    });

    docs.forEach(doc => {
        table.push([doc.track, doc.play_count]);
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
