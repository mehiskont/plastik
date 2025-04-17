#!/usr/bin/env node

/**
 * Simple MCP Supabase Tool Test
 */

// Load ts-node for TypeScript support
require('ts-node/register');

// Import the MCP tool
const { supabaseMcpTool } = require('../lib/mcp-tools/index.ts');

async function testMcpTool() {
  console.log('🔍 Testing MCP Supabase connection...');

  try {
    // Test connection
    const result = await supabaseMcpTool.handler({
      operation: 'test_connection'
    });

    console.log('Connection result:', result);

    // Test simple query
    console.log('\n🔍 Testing simple query...');
    
    const queryResult = await supabaseMcpTool.handler({
      operation: 'query',
      table: 'users',
      limit: 5
    });

    if (queryResult.error) {
      console.error('Query error:', queryResult.error);
    } else if (queryResult.data) {
      console.log(`Found ${queryResult.data.length} users`);
      console.log('First user:', queryResult.data[0]);
    } else {
      console.log('No users found or empty response');
    }

    console.log('\n✅ MCP tool tests completed!');

  } catch (error) {
    console.error('Error testing MCP tool:', error);
  }
}

testMcpTool();