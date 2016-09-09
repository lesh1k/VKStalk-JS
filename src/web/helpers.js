'use strict';

module.exports = exports = {};

exports.isValidId = function(id) {
    const regex = /^[\w.\-]{1,}$/i;
    return regex.test(id);
};
