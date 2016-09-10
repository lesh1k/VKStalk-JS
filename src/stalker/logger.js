'use strict';

const winston = require('winston');
const dailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const CONFIG = require('../config/config.json');


const logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            name: 'stalker-main-console',
            level: CONFIG.log_level || 'info',
            timestamp: true,
            showLevel: true,
            colorize: true
        }),
        new (dailyRotateFile)({
            name: 'error-file-daily',
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            exitOnError: true,
            filename: path.join(CONFIG.log_directory, 'error.log'),
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (dailyRotateFile)({
            name: 'vkstalk-daily',
            level: CONFIG.log_level || 'warn',
            filename: path.join(CONFIG.log_directory, 'vkstalk.log'),
            datePattern: '.yyyy-MM-dd',
            prepend: false
        })
    ]
});

module.exports = logger;
