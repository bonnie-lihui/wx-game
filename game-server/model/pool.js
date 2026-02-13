/**
 * MySQL 连接池
 * @file server-node/model/pool.js
 */

const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool(config.db);

module.exports = pool;
