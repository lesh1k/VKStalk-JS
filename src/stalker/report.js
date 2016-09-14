'use strict';

const co = require('co');

const logger = require('./logger.js');
const db = require('./db.js');
const collection = db.get('data');
const db_helpers = require('./helpers/db_helpers.js');

const REPORTERS = {
    'general': reportGeneral,
    'music': reportMusic
};

module.exports = function generateReport(type) {
    const reporter = REPORTERS[type];
    if (typeof reporter === 'function') {
        let args = [].slice.call(arguments, 1);
        return reporter.apply(null, args);
    }

    const message = Promise.resolve(`No report of type ${type}`);
    logger.error(message, {
        type: type,
        args: [].slice.call(arguments)
    });
    return message;
};

function reportGeneral(user_id) {
    logger.debug('Call reportGeneral()', {
        args: [].slice.call(arguments),
        user_id: user_id
    });
    return co(function*() {
            return yield* db_helpers.getLastUserDocument(collection, user_id);
        })
        .catch(err => {
            logger.error('Could not generate report.', err);
            setTimeout(() => {
                throw err;
            }, 2000);
        });
}

function reportMusic(user_id, params = {}) {
    logger.debug('Call reportMusic()', {
        args: [].slice.call(arguments),
        user_id: user_id
    });

    const timestamp_query = {};
    if (params.period && params.period.from) {
        timestamp_query.$gt = params.period.from;
    }

    if (params.period && params.period.to) {
        timestamp_query.$lt = params.period.to;
    }

    const match_query = {
        user_id: user_id,
        isListeningToMusic: true
    };

    if (Object.keys(timestamp_query).length) {
        match_query.timestamp = timestamp_query;
    }

    return co(function*() {

            const docs = yield collection.aggregate([{
                $match: match_query
            }, {
                $group: {
                    _id: {
                        track: '$Current status'
                    },
                    play_count: {
                        $sum: 1
                    }
                }
            }, {
                $project: {
                    _id: 0,
                    track: '$_id.track',
                    play_count: 1
                }
            }, {
                $sort: {
                    play_count: -1
                }
            }]);

            return docs;
        })
        .catch(err => {
            logger.error('Could not generate report.', err);
            setTimeout(() => {
                throw err;
            }, 2000);
        });
}
