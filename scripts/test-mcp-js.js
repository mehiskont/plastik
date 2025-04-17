#!/usr/bin/env node

/**
 * Test for JavaScript MCP Supabase Tool
 */
const { supabaseMcpTool } = require('../lib/mcp-tools/supabase-mcp');

async function runTests() {
  console.log('🧪 Testing MCP Supabase Tool (JS Version)\n');
  
  // Test 1: Connection test
  console.log('Test 1: Connection test');
  const connectionResult = await supabaseMcpTool.handler({
    operation: 'test_connection'
  });
  console.log('Result:', connectionResult);
  console.log('----------------------------\n');
  
  // Test 2: Create test table first
  console.log('Test 2: Create test table');
  
  // Use raw SQL query to create a test table
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in environment variables");
      throw new Error("Missing Supabase credentials");
    }
    
    const supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey);
    
    // Create a test table
    const { error: createError } = await supabase.rpc('create_test_table', {});
    
    if (createError) {
      console.log('Error creating test table via RPC, trying direct SQL');
      
      // Use direct SQL
      const { error } = await supabase
        .from('mcp_test')
        .insert({ id: 1, name: 'Test Record', created_at: new Date().toISOString() })
        .select();
      
      if (error && !error.message.includes('does not exist')) {
        console.log('Error:', error.message);
      }
    }
  } catch (err) {
    console.log('Setup error (expected):', err.message);
  }
  
  // Now query the test table
  console.log('Test 3: Query test data');
  const listResult = await supabaseMcpTool.handler({
    operation: 'query',
    table: 'mcp_test',
    limit: 5
  });
  
  if (listResult.success) {
    console.log(`Found ${listResult.data?.length || 0} test items`);
    if (listResult.data?.length > 0) {
      console.log('First item:', listResult.data[0]);
    }
  } else {
    console.log('Query failed:', listResult.error);
  }
  console.log('----------------------------\n');
  
  // Test 3: Insert test item
  console.log('Test 3: Insert test item');
  const timestamp = Date.now();
  const insertResult = await supabaseMcpTool.handler({
    operation: 'insert',
    table: 'mcp_test',
    data: {
      name: `Test Item ${timestamp}`,
      description: 'Inserted by MCP tool test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    returnData: true
  });
  
  if (insertResult.success) {
    console.log('Item inserted successfully');
    console.log('Item data:', insertResult.data?.[0]);
    
    // Store the item ID for later tests
    const itemId = insertResult.data?.[0]?.id;
    
    if (itemId) {
      // Test 4: Update the item
      console.log('\nTest 4: Update item');
      const updateResult = await supabaseMcpTool.handler({
        operation: 'update',
        table: 'mcp_test',
        filter: { id: itemId },
        data: {
          name: 'Updated Test Item',
          description: 'This item was updated by the MCP tool',
          updated_at: new Date().toISOString()
        },
        returnData: true
      });
      
      if (updateResult.success) {
        console.log('Item updated successfully');
        console.log('Updated item:', updateResult.data?.[0]);
      } else {
        console.log('Update failed:', updateResult.error);
      }
      
      // Test 5: Delete the item
      console.log('\nTest 5: Delete test item');
      const deleteResult = await supabaseMcpTool.handler({
        operation: 'delete',
        table: 'mcp_test',
        filter: { id: itemId },
        returnData: true
      });
      
      if (deleteResult.success) {
        console.log('Item deleted successfully');
        console.log('Deleted item count:', deleteResult.data?.length);
      } else {
        console.log('Delete failed:', deleteResult.error);
      }
    }
  } else {
    console.log('Insert failed:', insertResult.error);
  }
  
  // Test 6: Advanced query with complex filter
  console.log('\nTest 6: List all test items sorted by date');
  const complexQueryResult = await supabaseMcpTool.handler({
    operation: 'query',
    table: 'mcp_test',
    select: 'id, name, description, created_at',
    order: {
      column: 'created_at',
      ascending: false
    },
    limit: 5
  });
  
  if (complexQueryResult.success) {
    console.log(`Found ${complexQueryResult.data?.length || 0} items`);
    if (complexQueryResult.data?.length > 0) {
      console.log('Items:', complexQueryResult.data);
    }
  } else {
    console.log('Complex query failed:', complexQueryResult.error);
  }
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(error => {
  console.error('Test error:', error);
});