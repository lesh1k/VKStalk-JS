'use strict';

const helpers = require('./helpers/helpers.js');
const Table = require('cli-table');


module.exports = format;

const FORMATTERS = {
    'console': formatConsole,
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

function formatConsole(data) {
    let result = '';
    result += formatForConsole(data.user, data.logs_written);
    if (data.updates) {
        result += formatUpdates(data.updates);
    }

    return result;
}

function formatForConsole(data, logs_written = 0) {
    let launch_date = helpers.getProcessLaunchDate();
    let name = data.Name.replace('  ', ' ');
    let result = `App launched on ${launch_date}\n`;
    result += `User name: ${name}\n`;
    result += `User ID: ${data.user_id}\n`;
    result += `Logs written: ${logs_written}\n\n`;
    result += `>>> Checked on ${new Date(data.timestamp)} <<<\n\n`;
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
        head: ['#', 'Track', 'Times played', 'Last played']
    });

    docs.forEach((doc, i) => {
        table.push([i + 1, doc.track, doc.play_count, new Date(doc.last_played).toString()]);
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
