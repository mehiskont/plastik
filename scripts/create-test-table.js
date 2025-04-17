#!/usr/bin/env node

/**
 * Create test table script for MCP Supabase tool testing
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTable() {
  console.log('Creating test table for MCP tool tests...');
  
  try {
    // Create the test table via SQL (requires admin rights)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create test table for MCP tool testing
        CREATE TABLE IF NOT EXISTS mcp_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert some test data
        INSERT INTO mcp_test (name, description) 
        VALUES 
          ('Test Item 1', 'This is the first test item'),
          ('Test Item 2', 'This is the second test item'),
          ('Test Item 3', 'This is the third test item')
        ON CONFLICT (id) DO NOTHING;
      `
    });
    
    if (error) {
      console.error('Error creating test table via SQL function:', error.message);
      console.log('Note: You might need to create the table directly in the Supabase dashboard');
      
      // Try creating through regular insert (will fail if table doesn't exist)
      try {
        const { error: insertError } = await supabase
          .from('mcp_test')
          .insert([
            { name: 'Test Item 1', description: 'This is the first test item' },
            { name: 'Test Item 2', description: 'This is the second test item' },
            { name: 'Test Item 3', description: 'This is the third test item' }
          ]);
          
        if (insertError && !insertError.message.includes('does not exist')) {
          console.error('Error inserting data:', insertError.message);
        } else if (!insertError) {
          console.log('Successfully inserted test data!');
        }
      } catch (err) {
        console.error('Error during insert attempt:', err.message);
      }
    } else {
      console.log('Successfully created test table and inserted data!');
    }
    
    console.log('\nAction needed:');
    console.log('---------------------------------------');
    console.log('Since you might not have SQL execution privileges, please:');
    console.log('1. Go to the Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to "Table Editor" > "New Table"');
    console.log('3. Create a table named "mcp_test" with the following columns:');
    console.log('   - id: integer (primary key, auto-increment)');
    console.log('   - name: text (required)');
    console.log('   - description: text');
    console.log('   - created_at: timestamp with timezone (default: now())');
    console.log('   - updated_at: timestamp with timezone (default: now())');
    console.log('4. Add a few test records manually');
    console.log('5. Run the MCP tool test script again');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestTable();