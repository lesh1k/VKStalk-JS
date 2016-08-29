'use strict';

const express = require('express');
const app = express();
const body_parser = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 8080;
const web_routes = require('./routes/web.js');
const api_routes = require('./routes/api.js');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(express.static(path.join(__dirname, './views')));
app.use(body_parser.urlencoded({extended: true}));
app.use(body_parser.json());

// Register routes
app.use('/', web_routes);
app.use('/api', api_routes);

// Start the server
app.listen(PORT);
console.log(`Express server listening on port ${PORT}`);
