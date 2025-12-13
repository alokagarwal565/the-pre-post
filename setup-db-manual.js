/**
 * Database Setup Helper
 * Shows the migration SQL and guides you to run it in Neon SQL Editor
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.includes('YOUR_USERNAME') || databaseUrl.includes('ep-xxxx')) {
    console.error('❌ Please set DATABASE_URL in .env.local with your Neon connection string');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon to verify connection...\n');

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

    if (tables.length > 0) {
      console.log('✅ Tables already exist:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      const expectedTables = ['users', 'ideas', 'refined_ideas', 'mind_maps', 'content_history', 'content_plans', 'drafts'];
      const existingTableNames = tables.map(t => t.table_name);
      const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
      
      if (missingTables.length > 0) {
        console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('   You may need to run the migration.\n');
      } else {
        console.log('\n🎉 All tables exist! Database is ready.');
        console.log('\nNext steps:');
        console.log('1. Run: npm run dev');
        console.log('2. Open: http://localhost:3000\n');
        return;
      }
    } else {
      console.log('⚠️  No tables found. You need to run the migration.\n');
    }

    // Read and display migration file
    const migrationPath = path.join(__dirname, 'lib', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 To set up your database schema:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('OPTION 1: Use Neon SQL Editor (Recommended)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: https://console.neon.tech');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy the SQL below and paste it into the editor');
    console.log('6. Click "Run" (or press Ctrl+Enter)\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MIGRATION SQL (Copy this):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(migrationSQL);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('OPTION 2: Migration file location');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`File: ${migrationPath}`);
    console.log('You can open this file and copy its contents to Neon SQL Editor\n');

    console.log('After running the migration, verify by running: npm run setup-db\n');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct in .env.local');
    console.log('2. Make sure it includes ?sslmode=require');
    console.log('3. Check that your Neon project is active');
    process.exit(1);
  }
}

setupDatabase();

