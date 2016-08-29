'use strict';

const router = require('express').Router();

const report = require('../../stalker/report.js');

module.exports = router;


router.route('/')
    .get((req, res) => {
        res.sendFile('index.html');
    })
    .post((req, res) => {
        const action = req.body['action'];
        const user_id = req.body['user-id'];

        if (action === 'report') {
            report('music', user_id)
                .then(data => {
                    res.json(data);
                });
        } else {
            res.send(`Requested to ${action} on ${user_id}`);
        }
    });
