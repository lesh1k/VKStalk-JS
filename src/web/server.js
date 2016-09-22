'use strict';

const express = require('express');
const app = express();
const body_parser = require('body-parser');
const path = require('path');
const server = require('http').Server(app);
const cookieParser = require('cookie-parser');
const passportSocketIo = require('passport.socketio');
const io = require('./socket.js')(server);

// mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const DB_CONFIG = require(path.join(__dirname, '..', 'config', 'db.json'));
const db_url = `${DB_CONFIG.driver}://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.url}:${DB_CONFIG.port}/${DB_CONFIG.db_name}`;
mongoose.connect(db_url);

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const SECRETS = require('../config/secrets.json');
const PORT = process.env.PORT || 8100;
const web_routes = require('./routes/web.js');
// const api_routes = require('./routes/api.js');
const sessionStore = new MongoStore({mongooseConnection: mongoose.connection});
const session_opts = {
    saveUninitialized: true, // saved new sessions
    resave: false, // do not automatically write to the session store
    store: sessionStore,
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
app.use(session(session_opts));

// Configure passport
app.use(passport.initialize());
app.use(passport.session());
const User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Config socket.io with passport
io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: SECRETS.session.secret,
    store: sessionStore,
    passport: passport,
    cookieParser: cookieParser,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept) {
    console.log(`User ${data.user.username} successful connection to socket.io.`);
    accept();
}

function onAuthorizeFail(data, message, error, accept) {
    console.log('Failed connection to socket.io:', message);

    if (error)
        accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
}

// Register routes
app.use('/', web_routes);
// app.use('/api', api_routes);

// Restart existing stalkers
(function() {
    const helpers = require('./helpers');
    const format = require('./format');
    const StalkedId = require('./models/stalked_id');
    StalkedId.find({$where: 'this.subscribers.length > 0'})
        .then(docs => {
            docs.forEach(doc => {
                const stalked_id = doc.sid;
                console.log('Restaring existing WORKER for', stalked_id);
                const onMessage = msg => {
                    io.sockets.to(stalked_id).emit('stalk-data', {
                        stalked_id: stalked_id,
                        message: format('web', msg),
                        running: true
                    });
                };
                const args = ['stalk', stalked_id];
                const worker = helpers.spawnStalker(args, onMessage);
                worker.stalked_id = stalked_id;
            });
        });
})();

// Start the server
// app.listen(PORT);
server.listen(PORT);
console.log(`Express server listening on port ${PORT}`);
