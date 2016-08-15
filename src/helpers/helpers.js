'use strict';


module.exports = exports = {};

exports.clearConsole = function() {
    // console.log('\x1Bc');
    process.stdout.write('\x1Bc');
};

exports.getProcessLaunchDate = function() {
    // The result is not absolutely precise.
    // Deviations of up to 2 seconds are to be expected
    const ms_in_second = 1000;
    const now = new Date().getTime();
    const uptime = process.uptime() * ms_in_second;
    return new Date(now - uptime);
};
