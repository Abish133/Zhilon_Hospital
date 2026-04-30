require('dotenv').config();

const base = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'hms_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: 'mysql',
  // Store/read DATETIME columns in IST so reports & cron jobs match the wall-clock
  // a hospital in India sees, regardless of the server's OS timezone.
  timezone: '+05:30'
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base
};
