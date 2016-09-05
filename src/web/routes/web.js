'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const report = require('../../stalker/report.js');

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
        // const action = req.body['action'];
        const user_id = req.body['user-id'].trim();

        if (!user_id) {
            return res.sendStatus(400);
        }



        // switch (action) {
        //     case 'report':
        //         report('music', user_id)
        //             .then(data => {
        //                 res.json(data);
        //             });
        //         break;
        //     case 'stalk':
        //         res.redirect(`/stalk/${user_id}`);
        //         break;
        //     default:
        //         res.send(`Requested to ${action} on ${user_id}`);
        //         break;
        // }
    });

router.route('/register')
    .post((req, res, next) => {
        const username = req.body.username;
        const password = req.body.password;
        User.register(new User({username: username}), password, (err, user) => {
            if (err) {
                return res.render('login', {error: err.message});
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

router.route('/stalk/:user_id')
    .get((req, res) => {
        res.render('stalk');
    });
