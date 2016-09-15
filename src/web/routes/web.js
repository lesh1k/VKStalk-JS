'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const cluster = require('cluster');
const path = require('path');

const User = require('../models/user');
const helpers = require('../helpers');

module.exports = router;


router.all('*', requireAuthentication);

function requireAuthentication(req, res, next) {
    if (req.user || req.url === '/login' || req.url === '/register') {
        if (req.user) {
            res.locals.user = req.user;
        }

        return next();
    }

    res.redirect('/login');
}

router.route('/')
    .get((req, res) => {
        res.render('index');
    })
    .post((req, res) => {
        const user_id = req.body['user-id'].trim();

        if (!helpers.isValidId(user_id)) {
            return res.json({
                error: 'User ID invalid. Allowed are only chars, numbers and .-_',
                stalked_id: user_id
            });
        }

        if (req.user.stalked_ids.indexOf(user_id) === -1) {
            req.user.stalked_ids.push(user_id);
            User.update({
                _id: req.user._id
            }, {
                $set: {
                    stalked_ids: req.user.stalked_ids
                }
            }, () => {
                res.render('includes/stalk_card', {
                    stalk_id: user_id
                }, (err, html) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    res.json({
                        error: null,
                        message: 'User ID added successfully',
                        stalked_id: user_id,
                        html: html
                    });
                });
            });
        } else {
            res.json({
                error: 'This user ID is already in your list.',
                stalked_id: user_id
            });
        }
    });

router.route('/register')
    .post((req, res, next) => {
        const username = req.body.username;
        const password = req.body.password;
        User.register(new User({
            username: username
        }), password, (err, user) => {
            if (err) {
                return res.render('login', {
                    error: err.message
                });
            }

            passport.authenticate('local')(req, res, () => {
                req.session.save(err => {
                    if (err) {
                        return next(err);
                    }
                    res.redirect('/');
                });
            });
        });
    });

router.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post(passport.authenticate('local'), (req, res) => {
        res.redirect('/');
    });

router.route('/logout')
    .get((req, res) => {
        req.logout();
        res.redirect('/');
    });

router.route('/reports/:stalked_id/:report_type?')
    .get((req, res, next) => {
        if (!helpers.isValidId(req.params.stalked_id)) {
            return res.status(400).send('Invalid ID');
        }

        if (req.params.report_type && !helpers.isValidId(req.params.report_type)) {
            return res.status(400).send('Invalid report type');
        }

        if (req.user.stalked_ids.indexOf(req.params.stalked_id) === -1) {
            return res.status(403).send('Cannot view reports for non-tracked users');
        }

        next();
    });

router.route('/reports/:stalked_id')
    .get((req, res) => {
        return res.render('reports', {
            stalked_id: req.params.stalked_id
        });
    });

router.route('/reports/:stalked_id/:report_type')
    .get((req, res) => {
        const stalked_id = req.params.stalked_id;
        const report_type = req.params.report_type;
        if (!helpers.isValidId(report_type)) {
            return res.status(400).send('Invalid characters in report type');
        }

        const timeout_id = setTimeout(() => {
            res.status(500).send('Something went wrong. Please try again.');
        }, 100000);

        const onMessage = msg => {
            clearTimeout(timeout_id);
            const view_path = `includes/reports/${report_type}.pug`;

            delete msg.data._id;
            res.render(view_path, {data: msg.data}, (err, html) => {
                if (err) {
                    console.error(err);
                    return res.status(500, 'Error generating report');
                }

                res.json({
                    error: null,
                    stalked_id: req.params.stalked_id,
                    report_type: report_type,
                    report: html
                });
            });
        };

        const query_args = parseReportQueryToStalkerArgs(req.query);
        if (query_args.error) {
            clearTimeout(timeout_id);
            return res.status(400).send(query_args.error);
        }

        const args = ['report', stalked_id].concat(query_args.args);
        helpers.spawnStalker(args, onMessage);

    });

function parseReportQueryToStalkerArgs(q) {
    const result = {
        error: null,
        args: []
    };

    for (let k in q) {
        if (!helpers.isSanitized(q[k])) {
            result.error = 'Bad parameters';
            return result;
        }
    }

    const args = ['--type', q['report-type']];
    const dt_from = [q['date-from'], q['time-from']].join(' ').trim();
    const dt_to = [q['date-to'], q['time-to']].join(' ').trim();

    if (dt_from && dt_to) {
        var d1 = new Date(dt_from).getTime();
        var d2 = new Date(dt_to).getTime();
        if (d2 < d1) {
            result.error = '"Time to" must be bigger than "Time from"';
            return result;
        }
    }

    let period = '';
    if (dt_from || dt_to) {
        period = [dt_from, dt_to].join('..').trim();
    }

    if (period) {
        args.push('--period');
        args.push(period);
    }

    result.args = args;
    return result;
}
