const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAuth() {
  try {
    // Try to use the mysql_native_password plugin for connection
    let connection;
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        authPlugins: {
          mysql_native_password: () => () => process.env.DB_PASSWORD || 'root',
          caching_sha2_password: () => () => process.env.DB_PASSWORD || 'root'
        }
      });
    } catch (e) {
      // If that fails, try without the authPlugins
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root'
      });
    }

    console.log('Connected to MySQL');

    // Try multiple host variations for the ALTER USER command
    const hosts = ['localhost', '127.0.0.1', '172.17.0.1', '%'];
    let success = false;

    for (const host of hosts) {
      try {
        await connection.execute(
          `ALTER USER '${process.env.DB_USER || 'root'}'@'${host}' IDENTIFIED WITH mysql_native_password BY '${process.env.DB_PASSWORD || 'root'}'`
        );
        console.log(`Authentication method updated for ${host}`);
        success = true;
      } catch (err) {
        console.log(`Could not update for ${host}: ${err.message}`);
      }
    }

    if (success) {
      console.log('Successfully updated authentication method');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAuth();
