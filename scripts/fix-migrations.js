/**
 * This script removes UUID extension dependencies from Prisma migrations
 * Run with: node scripts/fix-migrations.js
 */

const fs = require('fs');
const path = require('path');
const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

// Get all migration directories
const migrationDirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Process each migration directory
migrationDirs.forEach(dir => {
  const migrationFilePath = path.join(migrationsDir, dir, 'migration.sql');
  
  // Skip if migration.sql doesn't exist
  if (!fs.existsSync(migrationFilePath)) {
    return;
  }
  
  let content = fs.readFileSync(migrationFilePath, 'utf8');
  
  // Check if file contains uuid-ossp extension
  if (content.includes('uuid-ossp')) {
    console.log(`Removing uuid-ossp from ${dir}/migration.sql`);
    
    // Replace the CREATE EXTENSION line with a comment
    content = content.replace(
      /CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"uuid-ossp".*?;/g, 
      '-- Removed: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    );
    
    // Write the modified content back
    fs.writeFileSync(migrationFilePath, content);
    console.log(`✅ Updated ${dir}/migration.sql`);
  }
});

console.log('Migration fix complete!');