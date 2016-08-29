'use strict';

const DB_CONFIG = require('../config/db.json');


const db_url = `${DB_CONFIG.driver}://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.url}:${DB_CONFIG.port}/${DB_CONFIG.db_name}`;
const db = require('monk')(db_url);

module.exports = db;
