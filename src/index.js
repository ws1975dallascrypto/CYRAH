'use strict';

const { getPool, query, closePool } = require('./db/connection');

async function main() {
  try {
    const result = await query('SELECT NOW() AS now');
    console.log('Connected to PostgreSQL. Server time:', result.rows[0].now);
  } catch (err) {
    console.error('Failed to connect:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
