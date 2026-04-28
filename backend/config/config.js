require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hms_db',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: 'mysql',
  // Store/read DATETIME columns in IST so reports & cron jobs match the wall-clock
  // a hospital in India sees, regardless of the server's OS timezone.
  timezone: '+05:30',
  logging: false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 60000,
    idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
  },
  retry: {
    max: 3
  }
};

module.exports = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME_TEST || `${base.database}_test` },
  production: { ...base, database: process.env.DB_NAME || `${base.database}_production` }
};
