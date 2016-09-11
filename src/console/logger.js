'use strict';

const winston = require('winston');
const dailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const CONFIG = require('../config/config.json');
const LOG_DIRECTORY = path.join(__dirname, '../../logs');


const logger = new winston.Logger({
    transports: [
        new (dailyRotateFile)({
            name: 'error-file-daily',
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            exitOnError: true,
            filename: path.join(LOG_DIRECTORY, 'error.log'),
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (dailyRotateFile)({
            name: 'vkstalk-daily',
            level: CONFIG.log_level || 'warn',
            filename: path.join(LOG_DIRECTORY, 'vkstalk.log'),
            datePattern: '.yyyy-MM-dd',
            prepend: false
        })
    ]
});

module.exports = logger;
