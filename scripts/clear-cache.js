// Script to clear Redis cache
// Run with: node scripts/clear-cache.js [pattern]
// Example: node scripts/clear-cache.js inventory:*

require('dotenv').config();
const { createClient } = require('redis');

async function main() {
  // Get pattern from command line argument
  const pattern = process.argv[2] || '*';
  
  console.log(`Attempting to clear Redis cache entries matching pattern: ${pattern}`);
  
  // Create Redis client
  const redisClient = createClient({
    url: "redis://localhost:6379",
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    process.exit(1);
  });
  
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
    
    // Get keys matching pattern
    const keys = await redisClient.keys(pattern);
    console.log(`Found ${keys.length} cache entries matching pattern '${pattern}'`);
    
    if (keys.length > 0) {
      // Delete the keys
      await redisClient.del(keys);
      console.log(`Successfully cleared ${keys.length} cache entries`);
      
      // Print the deleted keys if there aren't too many
      if (keys.length <= 20) {
        console.log('Cleared keys:');
        keys.forEach(key => console.log(`  - ${key}`));
      } else {
        console.log(`Cleared ${keys.length} keys. First 10 keys:`);
        keys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
      }
    } else {
      console.log('No matching cache entries found');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    console.log('Disconnected from Redis');
  }
}

main();