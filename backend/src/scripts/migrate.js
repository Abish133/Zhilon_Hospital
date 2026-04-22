require('dotenv').config();
const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize.Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

const migrationsDir = path.resolve(__dirname, '..', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.js'))
  .sort();

const umzug = new Umzug({
  migrations: migrationFiles.map(file => {
    const mod = require(path.join(migrationsDir, file));
    return {
      name: file,
      up: async () => mod.up(sequelize.getQueryInterface(), Sequelize),
      down: async () => mod.down(sequelize.getQueryInterface(), Sequelize),
    };
  }),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    const pending = await umzug.pending();
    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }
    
    console.log(`Running ${pending.length} migration(s)...`);
    const migrations = await umzug.up();
    
    console.log('✓ Migrations completed:');
    migrations.forEach(m => console.log(`  - ${m.name}`));
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function rollback(steps = 1) {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    const executed = await umzug.executed();
    if (executed.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${steps} migration(s)...`);
    const migrations = await umzug.down({ step: steps });
    
    console.log('✓ Rollback completed:');
    migrations.forEach(m => console.log(`  - ${m.name}`));
  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function rollbackAll() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    const executed = await umzug.executed();
    if (executed.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }

    console.log(`Rolling back ALL ${executed.length} migration(s)...`);
    const migrations = await umzug.down({ to: 0 });

    console.log('✓ All migrations rolled back:');
    migrations.forEach(m => console.log(`  - ${m.name}`));
  } catch (error) {
    console.error('✗ Rollback-all failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function status() {
  try {
    await sequelize.authenticate();
    
    const executed = await umzug.executed();
    const pending = await umzug.pending();
    
    console.log('\n=== Migration Status ===\n');
    console.log(`Executed: ${executed.length}`);
    executed.forEach(m => console.log(`  ✓ ${m.name}`));
    
    console.log(`\nPending: ${pending.length}`);
    pending.forEach(m => console.log(`  ○ ${m.name}`));
    console.log('');
  } catch (error) {
    console.error('✗ Status check failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

const command = process.argv[2];

switch (command) {
  case 'up':
    migrate().catch(() => process.exit(1));
    break;
  case 'down':
    if (process.argv[3] === 'all') {
      rollbackAll().catch(() => process.exit(1));
    } else {
      const steps = parseInt(process.argv[3]) || 1;
      rollback(steps).catch(() => process.exit(1));
    }
    break;
  case 'down:all':
    rollbackAll().catch(() => process.exit(1));
    break;
  case 'status':
    status().catch(() => process.exit(1));
    break;
  default:
    console.log('Usage:');
    console.log('  npm run migrate:up        - Run pending migrations');
    console.log('  npm run migrate:down      - Rollback last migration');
    console.log('  npm run migrate:down 3    - Rollback last 3 migrations');
    console.log('  npm run migrate:down:all  - Rollback ALL migrations');
    console.log('  npm run migrate:status    - Show migration status');
    process.exit(1);
}
