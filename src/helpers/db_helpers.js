'use strict';

module.exports = exports = {};

exports.getLastUserDocument = function* (collection, user_id) {
    let cursor = yield collection.find({
        user_id: user_id
    }, {
        rawCursor: true
    });

    let last_document = yield cursor.sort([
        ['timestamp', -1]
    ]).limit(1).toArray();
    last_document = last_document[0];

    return last_document;
};