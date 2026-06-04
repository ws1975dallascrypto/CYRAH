'use strict';

const fs = require('fs');
const path = require('path');
const { query, closePool } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await query('SELECT filename FROM schema_migrations');
  const done = new Set(applied.rows.map((r) => r.filename));

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying ${file}…`);
    await query(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`  done.`);
  }

  console.log('All migrations applied.');
  await closePool();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
  closePool();
});
