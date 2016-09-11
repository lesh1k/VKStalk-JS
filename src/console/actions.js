'use strict';

const format = require('./format.js');
const helpers = require('./helpers/helpers.js');


module.exports = exports = {};

exports.stalk = user_id => {
    // console.log('Creating new WORKER.');
    const args = ['stalk', user_id];
    const onMessage = msg => {
        if (msg.type === 'message') {
            console.log(msg.data);
        } else if (msg.type === 'user-data-and-updates') {
            helpers.clearConsole();
            console.log(format('console', msg.data));
        }
    };
    helpers.spawnStalker(args, onMessage);
};

exports.report = (user_id, options) => {
    const type = options.type || 'music';
    const args = ['report', '--type', type, user_id];
    const onMessage = msg => {
        console.log(msg);
        process.exit();
    };
    helpers.spawnStalker(args, onMessage);
};
