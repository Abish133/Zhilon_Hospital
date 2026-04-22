/**
 * Full migration-driven reset:
 *   1) DROP DATABASE + CREATE DATABASE          (clean slate — equivalent to undoing every migration)
 *   2) npx sequelize-cli db:migrate             (runs every migration up, in order)
 *   3) sequelize.sync()                         (creates any model tables with no matching migration —
 *                                                 plain sync, NOT force/alter, so existing tables are untouched)
 *   4) node src/scripts/seed.js                 (loads comprehensive demo data)
 *
 * Why drop the DB instead of running `db:migrate:undo:all`?
 * The legacy DB may contain tables created via `sequelize.sync` that have no
 * matching migration. Those break `undo:all`. Dropping the DB sidesteps that
 * and gives a guaranteed clean state.
 *
 * Why the plain sync() after migrations?
 * Some models (DoctorQualification, DoctorLeave, SalaryStructure, Payroll,
 * Refund, PaymentAdvance, etc.) have no migration. Plain sync creates those
 * missing tables without altering ones the migrations already built.
 *
 *   node src/scripts/migrateAndSeed.js
 *   npm  run db:reset-and-seed
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'hms_db';

async function resetDatabase() {
  console.log('\n──────────── 1/4  Reset database (drop + create) ────────────');
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    multipleStatements: true
  });
  try {
    console.log(`  → Connected to MySQL at ${DB_HOST}:${DB_PORT}`);
    console.log(`  → DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    console.log(`  → CREATE DATABASE \`${DB_NAME}\``);
    await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('  ✔ Database reset to clean state');
  } finally {
    await conn.end();
  }
}

function step(label, cmd) {
  console.log(`\n──────────── ${label} ────────────`);
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

async function createMissingTables() {
  console.log('\n──────────── 3/4  Plain sync (create tables missing from migrations) ────────────');
  // Lazy-require so a connection isn't opened until after the DB has been recreated.
  const db = require(path.join(ROOT, 'src', 'models'));
  await db.sequelize.authenticate();
  console.log('  → Connected via Sequelize models');
  // Plain sync: creates tables that don't exist; does NOT alter or drop existing ones.
  await db.sequelize.sync();
  console.log('  ✔ Missing model tables created (existing tables untouched)');
  await db.sequelize.close();
}

(async () => {
  try {
    await resetDatabase();
    step('2/4  Run ALL migrations', 'npx sequelize-cli db:migrate');
    await createMissingTables();
    step('4/4  Seed demo data',     'node src/scripts/seed.js');
    console.log('\n✅ Migrate + seed complete.\n');
  } catch (e) {
    console.error('\n✗ Migrate-and-seed failed:', e.message || e);
    process.exit(1);
  }
})();
