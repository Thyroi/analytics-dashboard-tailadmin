// scripts/ensure-prisma.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Ensuring Prisma client is ready...');

// Check if .prisma directory exists
const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');

try {
  // Clean .prisma directory if it exists
  console.log('1. Cleaning Prisma cache...');
  if (fs.existsSync(prismaDir)) {
    fs.rmSync(prismaDir, { recursive: true, force: true });
    console.log('   Cleaned .prisma directory');
  }

  // Generate Prisma client
  console.log('2. Generating Prisma client...');
  console.log('   Prisma client generation...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('   Prisma client generation completed');

  console.log('Prisma client is ready!');
  process.exit(0);
} catch (error) {
  console.error('Error ensuring Prisma client:', error.message);
  process.exit(1);
}
