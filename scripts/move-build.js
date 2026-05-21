const fs = require('fs-extra');
const path = require('path');

async function build() {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  const backendPublic = path.join(__dirname, '../backend/public');

  try {
    console.log('Cleaning backend/public...');
    await fs.remove(backendPublic);
    
    console.log('Creating backend/public...');
    await fs.ensureDir(backendPublic);
    
    console.log('Copying frontend/dist to backend/public...');
    await fs.copy(frontendDist, backendPublic);
    
    console.log('Build move completed successfully!');
  } catch (err) {
    console.error('Error during build move:', err);
    process.exit(1);
  }
}

build();
