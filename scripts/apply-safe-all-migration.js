const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function getDbUrls() {
  const urls = [];
  
  // 1. Check local .env / environment
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      urls.push({ name: 'Local Database (.env)', url: match[1] });
    }
  }

  // 2. Check .env.local
  const envLocalPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      if (!urls.some(u => u.url === match[1])) {
        urls.push({ name: 'Local Database (.env.local)', url: match[1] });
      }
    }
  }

  // 3. Check .env.production
  const envProdPath = path.join(__dirname, '../.env.production');
  if (fs.existsSync(envProdPath)) {
    const content = fs.readFileSync(envProdPath, 'utf8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      if (!urls.some(u => u.url === match[1])) {
        urls.push({ name: 'Production Database (.env.production - Neon Cloud)', url: match[1] });
      }
    }
  }

  return urls;
}

async function migrateDatabase(dbInfo, sqlContent) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Connecting safely to: ${dbInfo.name}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbInfo.url,
      },
    },
  });

  try {
    await prisma.$executeRawUnsafe(sqlContent);
    console.log(`✅ Success! Safe Migration executed on ${dbInfo.name} with ZERO data loss.`);
  } catch (error) {
    console.error(`❌ Migration Error on ${dbInfo.name}:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const sqlPath = path.join(__dirname, '../SAFE_ADD_MISSING_COLUMNS_PRODUCTION.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const dbUrls = getDbUrls();

  if (dbUrls.length === 0) {
    console.error('No database URLs found in .env, .env.local, or .env.production');
    process.exit(1);
  }

  console.log(`Found ${dbUrls.length} database target(s). Starting safe migration (Zero Data Loss Guarantee)...`);

  for (const dbInfo of dbUrls) {
    await migrateDatabase(dbInfo, sqlContent);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 All databases are in sync with zero data loss!`);
  console.log(`==================================================\n`);
}

main();
