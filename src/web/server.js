'use strict';

const express = require('express');
const app = express();
const body_parser = require('body-parser');
const path = require('path');
const server = require('http').Server(app);
const cookieParser = require('cookie-parser');
const socket = require('./socket.js')(server);
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const SECRETS = require('../config/secrets.json');
const PORT = process.env.PORT || 8080;
const web_routes = require('./routes/web.js');
const api_routes = require('./routes/api.js');
const session_opts = {
    saveUninitialized: true, // saved new sessions
    resave: false, // do not automatically write to the session store
    // store: sessionStore,
    secret: SECRETS.session.secret,
    cookie: {
        httpOnly: true,
        maxAge: 2419200000
    } // configure when sessions expires
};

// Configure template engine
app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

// Configure assets paths
app.use('/node_m', express.static(path.join(__dirname, '..', 'node_modules')));
app.use('/app', express.static(path.join(__dirname, 'app')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(body_parser.urlencoded({
    extended: true
}));
app.use(body_parser.json());
app.use(cookieParser(SECRETS.session.secret));
app.use(require('express-session')(session_opts));

// Configure passport
app.use(passport.initialize());
app.use(passport.session());
const User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// mongoose
const DB_CONFIG = require(path.join(__dirname, '..', 'config', 'db.json'));
const db_url = `${DB_CONFIG.driver}://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.url}:${DB_CONFIG.port}/${DB_CONFIG.db_name}`;
mongoose.connect(db_url);

// Register routes
app.use('/', web_routes);
app.use('/api', api_routes);

// Start the server
// app.listen(PORT);
server.listen(PORT);
console.log(`Express server listening on port ${PORT}`);
