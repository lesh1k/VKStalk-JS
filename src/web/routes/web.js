'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
// const report = require('../../stalker/report.js');

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
        console.log(req.user);
        res.render('index');
    })
    .post((req, res) => {
        // const action = req.body['action'];
        const user_id_regex = /^[a-z0-9.\-_]{1,}$/i;
        const user_id = req.body['user-id'].trim();
        const is_invalid_user_id = (!user_id || !user_id_regex.test(user_id));

        if (is_invalid_user_id) {
            return res.sendStatus(400);
        }

        if (req.user.stalked_ids.indexOf(user_id) === -1) {
            req.user.stalked_ids.push(user_id);
            User.update({_id: req.user._id}, {$set: {stalked_ids: req.user.stalked_ids}}, () => {
                res.render('index');
            });
        } else {
            res.send('This user ID is already in your list.');
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
