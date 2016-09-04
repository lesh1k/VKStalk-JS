'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const report = require('../../stalker/report.js');

module.exports = router;


router.route('/')
    .get((req, res) => {
        res.render('index', {user: req.user});
    })
    .post((req, res) => {
        const action = req.body['action'];
        const user_id = req.body['user-id'];

        switch (action) {
            case 'report':
                report('music', user_id)
                    .then(data => {
                        res.json(data);
                    });
                break;
            case 'stalk':
                res.redirect(`/stalk/${user_id}`);
                break;
            default:
                res.send(`Requested to ${action} on ${user_id}`);
                break;
        }
    });

router.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        User.register(new User({username: username}), password, (err, user) => {
            if (err) {
                return res.render('register', {user: user, error: err.message});
            }

            passport.authenticate('local')(req, res, () => {
                res.redirect('/');
            });
        });
    });

router.route('/login')
    .get((req, res) => {
        res.render('login', {user: req.user});
    })
    .post(passport.authenticate('local'), (req, res) => {
        res.redirect('/');
    });

router.route('/logout')
    .get((req, res) => {
        req.logout();
        res.redirect('/');
    });

router.route('/stalk/:user_id')
    .get((req, res) => {
        res.render('stalk');
    });
