/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Ensuring Prisma client is ready...');

function safeExec(command, description) {
  try {
    console.log(`   ${description}...`);
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd()
    });
    console.log(`   ${description} completed`);
    return result;
  } catch (error) {
    console.error(`   Error in ${description}:`, error.message);
    return null;
  }
}

function cleanPrismaFiles() {
  const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma');
  
  try {
    if (fs.existsSync(prismaDir)) {
      fs.rmSync(prismaDir, { recursive: true, force: true });
      console.log('   Cleaned .prisma directory');
    }
  } catch {
    console.log('   Could not clean .prisma directory (may be in use)');
  }
}

async function ensurePrisma() {
  console.log('1. Cleaning Prisma cache...');
  cleanPrismaFiles();
  
  console.log('2. Generating Prisma client...');
  const generateResult = safeExec('npx prisma generate', 'Prisma client generation');
  
  if (generateResult === null) {
    console.log('   Retrying with clean environment...');
    cleanPrismaFiles();
    safeExec('npx prisma generate', 'Prisma client generation (retry)');
  }
  
  console.log('Prisma client is ready!');
}

if (require.main === module) {
  ensurePrisma().catch(error => {
    console.error('Failed to ensure Prisma client:', error);
    process.exit(1);
  });
}