'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    username: String,
    password: String,
    stalked_ids: Array,
    stalkers_count: {
        type: Number,
        default: 0,
        min: 0
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('WebUser', User);
