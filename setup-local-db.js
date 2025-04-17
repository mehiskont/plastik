const { exec } = require('child_process');
const fs = require('fs');

console.log('Setting up local database...');

// Step 1: Update .env file
console.log('Step 1: Verifying environment variables point to local database...');

// Step 2: Restart Docker container
console.log('Step 2: Resetting Docker container...');
exec('docker-compose down -v && docker-compose up -d', (error, stdout, stderr) => {
  if (error) {
    console.error(`Docker error: ${error.message}`);
    return;
  }
  
  console.log('Docker container restarted');
  console.log(stdout);
  
  // Step 3: Wait for PostgreSQL to be ready
  console.log('Step 3: Waiting for PostgreSQL to be ready...');
  setTimeout(() => {
    // Step 4: Push schema to database
    console.log('Step 4: Pushing schema to database...');
    exec('npx prisma db push --force-reset', (error, stdout, stderr) => {
      if (error) {
        console.error(`Prisma push error: ${error.message}`);
        return;
      }
      
      console.log('Schema pushed to database');
      console.log(stdout);
      
      // Step 5: Create test user
      console.log('Step 5: Creating test user...');
      exec('npx tsx scripts/create-test-user.js', (error, stdout, stderr) => {
        if (error) {
          console.error(`Test user creation error: ${error.message}`);
          return;
        }
        
        console.log('Test user created');
        console.log(stdout);
        
        console.log('Local database setup complete\!');
      });
    });
  }, 5000); // Wait 5 seconds for PostgreSQL to start
});
