'use strict';

module.exports = exports = {};

exports.getLastUserDocument = function* (collection, user_id) {
    const doc = yield collection.findOne({user_id: user_id}, {sort: {timestamp: -1}});
    return doc;
};
