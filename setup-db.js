/**
 * Database Setup Helper Script
 * This script helps you verify your Neon database connection
 * 
 * Usage: node setup-db.js
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    console.log('\nPlease:');
    console.log('1. Go to https://console.neon.tech');
    console.log('2. Create a project and get your connection string');
    console.log('3. Update DATABASE_URL in .env.local');
    process.exit(1);
  }

  if (databaseUrl.includes('YOUR_USERNAME') || databaseUrl.includes('ep-xxxx')) {
    console.error('❌ DATABASE_URL still contains placeholder values');
    console.log('\nPlease replace the placeholder in .env.local with your actual Neon connection string');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set');
  console.log('🔗 Connecting to Neon database...\n');

  try {
    const sql = neon(databaseUrl);

    // Test connection
    const result = await sql`SELECT version()`;
    console.log('✅ Successfully connected to Neon database!');
    console.log(`📊 PostgreSQL version: ${result[0].version}\n`);

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found. Running migration...\n');
      
      console.log('📄 To create tables, please:');
      console.log('   1. Go to your Neon dashboard');
      console.log('   2. Click "SQL Editor"');
      console.log('   3. Open lib/migrations/001_initial_schema.sql');
      console.log('   4. Copy and paste the entire file into the SQL Editor');
      console.log('   5. Click "Run"\n');
      console.log('   Or run: npm run setup-db-manual\n');
    } else {
      console.log('✅ Tables already exist:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('\n💡 If you need to re-run the migration, you can:');
      console.log('   1. Use the Neon SQL Editor to run lib/migrations/001_initial_schema.sql');
      console.log('   2. Or drop tables manually and run this script again\n');
    }

    console.log('🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Create an account and start using The Pre-Post!\n');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Make sure it includes ?sslmode=require');
    console.log('3. Check that your Neon project is active');
    process.exit(1);
  }
}

setupDatabase();

