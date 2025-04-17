/**
 * Environment Variable Management Script
 * 
 * This script helps manage environment variables by:
 * 1. Checking for required environment variables
 * 2. Allowing easy updating of environment variable values
 * 3. Creating .env files if they don't exist
 */

const fs = require('fs');
const readline = require('readline');

// Define required environment variables by category
const REQUIRED_VARS = {
  AUTH: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  DATABASE: [
    'DATABASE_URL', 
    'DIRECT_URL'
  ],
  CACHE: [
    'REDIS_URL'
  ],
  PAYMENTS: [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ],
  INTEGRATIONS: [
    'DISCOGS_API_TOKEN',
    'DISCOGS_USERNAME',
    'DISCOGS_CONSUMER_KEY',
    'DISCOGS_CONSUMER_SECRET',
    'RESEND_API_KEY'
  ]
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Reads an environment file
 * @param {string} filePath - Path to the environment file
 * @returns {Object} Object with environment variables
 */
function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist. Will create it if needed.`);
      return {};
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    data.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) return;
      
      // Parse name=value pairs
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        env[key] = value;
      }
    });
    
    return env;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return {};
  }
}

/**
 * Writes environment variables to a file
 * @param {string} filePath - Path to write the file
 * @param {Object} envVars - Environment variables object
 * @param {Object} comments - Optional comments for sections
 */
function writeEnvFile(filePath, envVars, comments = {}) {
  try {
    let output = `# Environment Variables\n# Updated on ${new Date().toISOString()}\n\n`;
    
    // Group variables by category
    Object.entries(REQUIRED_VARS).forEach(([category, vars]) => {
      output += `# ${category}\n`;
      if (comments[category]) {
        output += `# ${comments[category]}\n`;
      }
      
      vars.forEach(key => {
        if (envVars[key] !== undefined) {
          output += `${key}="${envVars[key]}"\n`;
        } else {
          output += `# ${key}=""\n`;
        }
      });
      
      output += '\n';
    });
    
    // Add any additional variables not in the categories
    output += '# Additional Variables\n';
    Object.entries(envVars).forEach(([key, value]) => {
      if (!Object.values(REQUIRED_VARS).flat().includes(key)) {
        output += `${key}="${value}"\n`;
      }
    });
    
    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`${filePath} has been updated.`);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

/**
 * Checks for missing required variables
 * @param {Object} envVars - Environment variables object
 * @returns {Array} List of missing variables
 */
function checkMissingVars(envVars) {
  const missing = [];
  
  Object.values(REQUIRED_VARS).flat().forEach(key => {
    if (!envVars[key]) {
      missing.push(key);
    }
  });
  
  return missing;
}

/**
 * Main function to check and update environment variables
 */
async function main() {
  // Read both production and development env files
  console.log('Reading environment files...');
  const prodEnv = readEnvFile('.env');
  const devEnv = readEnvFile('.env.local');
  
  // Check for missing variables
  const missingProd = checkMissingVars(prodEnv);
  const missingDev = checkMissingVars(devEnv);
  
  console.log('\n==== Environment Status ====');
  console.log(`Production (.env): ${missingProd.length ? 'Missing variables' : 'All required variables present'}`);
  console.log(`Development (.env.local): ${missingDev.length ? 'Missing variables' : 'All required variables present'}`);
  
  if (missingProd.length) {
    console.log('\nMissing production variables:');
    missingProd.forEach(key => console.log(`- ${key}`));
  }
  
  if (missingDev.length) {
    console.log('\nMissing development variables:');
    missingDev.forEach(key => console.log(`- ${key}`));
  }
  
  // Ask user what they want to do
  console.log('\nOptions:');
  console.log('1. Update production environment (.env)');
  console.log('2. Update development environment (.env.local)');
  console.log('3. Exit');
  
  rl.question('\nChoose an option (1-3): ', answer => {
    const option = parseInt(answer);
    
    if (option === 1) {
      updateEnvFile('.env', prodEnv);
    } else if (option === 2) {
      updateEnvFile('.env.local', devEnv);
    } else {
      console.log('Exiting...');
      rl.close();
    }
  });
}

/**
 * Update an environment file interactively
 * @param {string} filePath - Path to the environment file
 * @param {Object} currentEnv - Current environment variables
 */
function updateEnvFile(filePath, currentEnv) {
  console.log(`\nUpdating ${filePath}...`);
  
  // Ask for variables by category
  const categories = Object.keys(REQUIRED_VARS);
  askForCategory(0, categories, filePath, currentEnv);
}

/**
 * Ask for variables by category
 * @param {number} index - Current category index
 * @param {Array} categories - List of categories
 * @param {string} filePath - Path to the environment file
 * @param {Object} currentEnv - Current environment variables
 */
function askForCategory(index, categories, filePath, currentEnv) {
  if (index >= categories.length) {
    // All categories processed, write to file
    writeEnvFile(filePath, currentEnv);
    console.log(`\nEnvironment file ${filePath} has been updated.`);
    rl.close();
    return;
  }
  
  const category = categories[index];
  console.log(`\n== ${category} ==`);
  
  // Ask for each variable in this category
  const vars = REQUIRED_VARS[category];
  askForVariable(0, vars, category, filePath, currentEnv, () => {
    // Move to next category
    askForCategory(index + 1, categories, filePath, currentEnv);
  });
}

/**
 * Ask for a specific variable
 * @param {number} index - Current variable index
 * @param {Array} vars - List of variables
 * @param {string} category - Current category
 * @param {string} filePath - Path to the environment file
 * @param {Object} currentEnv - Current environment variables
 * @param {Function} callback - Function to call when done
 */
function askForVariable(index, vars, category, filePath, currentEnv, callback) {
  if (index >= vars.length) {
    // All variables in this category processed
    callback();
    return;
  }
  
  const key = vars[index];
  const currentValue = currentEnv[key] || '';
  
  rl.question(`${key} [${currentValue}]: `, answer => {
    // If answer is provided, update the environment
    if (answer.trim()) {
      currentEnv[key] = answer.trim();
    }
    
    // Move to next variable
    askForVariable(index + 1, vars, category, filePath, currentEnv, callback);
  });
}

// Run the main function
main().catch(console.error);