/**
 * Drops the database (if it exists), recreates it, generates the schema from
 * the Sequelize models (authoritative source of truth for this app), then
 * runs the comprehensive seed. Intended for local / demo use only.
 *
 *   node src/scripts/resetDatabase.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path = require('path');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'hms_db';

async function resetSchema() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await conn.end();
  }
}

async function syncModels() {
  const db = require('../models');
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: true });
  await db.sequelize.close();
}

function runSeed() {
  execSync('node src/scripts/seed.js', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..', '..')
  });
}

(async () => {
  try {
    await resetSchema();
    await syncModels();
    runSeed();
  } catch (e) {
    console.error('\u2717 Reset failed:', e.message);
    process.exit(1);
  }
})();
