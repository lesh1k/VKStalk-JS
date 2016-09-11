'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const cluster = require('cluster');
const path = require('path');
const fs = require('fs');

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
            return res.sendStatus(400);
        }

        next();
    })
    .get((req, res) => {
        const stalked_id = req.params.stalked_id;
        const report_type = req.params.report_type;
        if (!helpers.isValidId(report_type)) {
            return res.sendStatus(400, 'Invalid characters in report type');
        }

        const timeout_id = setTimeout(() => {
            res.sendStatus(500);
        }, 10000);

        cluster.setupMaster({
            exec: path.resolve(__dirname, '../../stalker/run'),
            args: ['report', '--type', report_type, stalked_id],
            silent: true
        });

        const worker = cluster.fork();
        worker.on('message', msg => {
            clearTimeout(timeout_id);
            const view_path = `includes/reports/${report_type}.pug`;

            delete msg.data._id;
            res.render(view_path, {data: msg.data}, (err, html) => {
                if (err) {
                    console.error(err);
                    html = 'Error generating report';
                }

                res.render('reports', {
                    stalked_id: req.params.stalked_id,
                    report_type: report_type,
                    report: html
                });
            });
        });

        worker.on('error', err => {
            throw err;
        });
    });
