'use strict';

const co = require('co');
const db = require('./db.js');
const collection = db.get('data');
const db_helpers = require('./helpers/db_helpers.js');

const REPORTERS = {
    'general': reportGeneral,
    'music': reportMusic
};

module.exports = function generateReport(type, user_id) {
    const reporter = REPORTERS[type];
    if (typeof reporter === 'function') {
        let args = [].slice.call(arguments, 1);
        return reporter.apply(null, args);
    }

    return `No summarizer for type ${type}`;
};

function reportGeneral(user_id) {
    return co(function* () {
        return yield * db_helpers.getLastUserDocument(collection, user_id);
    })
    .catch(err => {
        throw err;
    });
}

function reportMusic(user_id) {
    return co(function* () {
        const docs = yield collection.aggregate([
            {$match: {user_id: user_id, isListeningToMusic: true}},
            {$group: {_id: {track: '$Current status'}, play_count: {$sum: 1}}},
            {$project: {_id: 0, track:'$_id.track', play_count: 1}}
        ]);

        return docs;
    })
    .catch(err => {
        throw err;
    });
}
