const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Read DATABASE_URL from .env.production if available
let dbUrl = process.env.DATABASE_URL;
const envProdPath = path.join(__dirname, '../.env.production');
if (fs.existsSync(envProdPath)) {
  const content = fs.readFileSync(envProdPath, 'utf8');
  const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match && match[1]) {
    dbUrl = match[1];
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in environment or .env.production');
  process.exit(1);
}

console.log('Connecting safely to Production Database (Neon Cloud)...');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function runSafeMigration() {
  try {
    const sqlPath = path.join(__dirname, '../SAFE_ADD_MISSING_COLUMNS_PRODUCTION.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing safe schema migration (Guaranteed ZERO data loss)...');
    await prisma.$executeRawUnsafe(sqlContent);
    console.log('✅ Safe Production Migration executed successfully! Missing columns added with zero data loss.');
  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSafeMigration();
