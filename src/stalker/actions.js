'use strict';

const scraper = require('./scraper');
const report = require('./report');
const logger = require('./logger');
const helpers = require('./helpers/helpers');


exports.stalk = user_id => {
    scraper.work(user_id);
};

exports.report = (user_id, options) => {
    const type = options.type;
    const params = {
        period: options.period
    };
    logger.info(`Requested ${type} report for user with ID=${user_id}.`, {params: params});
    report(type, user_id, params)
        .then(data => {
            helpers.sendData({
                type: 'report',
                report_type: type,
                data: data
            });
            process.exit();
        });
};
