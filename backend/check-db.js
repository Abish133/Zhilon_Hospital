require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
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

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');
    
    // Check grn_details
    const [grnResults] = await sequelize.query('DESCRIBE grn_details');
    console.log('=== grn_details Table Structure ===\n');
    console.table(grnResults);
    
    // Check medicine_batches
    const [batchResults] = await sequelize.query('DESCRIBE medicine_batches');
    console.log('\n=== medicine_batches Table Structure ===\n');
    console.table(batchResults);
    
    const hasGrnIdInDetails = grnResults.some(col => col.Field === 'grn_id');
    const hasGrnIdInBatches = batchResults.some(col => col.Field === 'grn_id');
    
    console.log('\n=== Results ===');
    console.log('grn_details.grn_id:', hasGrnIdInDetails ? '✓ EXISTS' : '✗ MISSING');
    console.log('medicine_batches.grn_id:', hasGrnIdInBatches ? '✓ EXISTS' : '✗ MISSING');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();
