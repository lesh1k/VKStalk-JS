'use strict';

const router = require('express').Router();

module.exports = router;


router.get('/', (req, res) => {
    res.json({
        date: new Date(),
        message: 'Hello, man!',
        another_string: 'Just some string.'
    });
});
