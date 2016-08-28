'use strict';

const winston = require('winston');
const dailyRotateFile = require('winston-daily-rotate-file');


const logger = new winston.Logger({
    transports: [
        new (dailyRotateFile)({
            name: 'exception-file-daily',
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            filename: '../logs/exception.log',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (dailyRotateFile)({
            name: 'error-file-daily',
            level: 'error',
            filename: '../logs/error.log',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (dailyRotateFile)({
            name: 'info-file-daily',
            level: 'info',
            filename: '../logs/info.log',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (dailyRotateFile)({
            name: 'debug-file-daily',
            level: 'debug',
            filename: '../logs/debug.log',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        })
    ]
});

module.exports = logger;
