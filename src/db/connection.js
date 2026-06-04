'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL client error:', err.message);
    });
  }
  return pool;
}

async function getConnection() {
  return getPool().connect();
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, getConnection, query, closePool };
