'use strict';

const express = require('express');
const router = express.Router();

const report = require('../../stalker/report.js');

module.exports = router;


router.route('/')
    .get((req, res) => {
        res.sendFile('index.html', {root: __dirname + '/../views'});
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

router.route('/stalk/:user_id')
    .get((req, res) => {
        res.sendFile('stalk.html', {root: __dirname + '/../views'});
    });
