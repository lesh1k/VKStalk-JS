'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const StalkedId = new Schema({
    sid: String,
    subscribers: Array
});

module.exports = mongoose.model('StalkedId', StalkedId);
