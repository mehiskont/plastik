import { 
  executeQuery, 
  insertData, 
  updateData, 
  deleteData, 
  testConnection 
} from "./supabase-tool";

// Simple logger function for testing
const log = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

// Define the MCP tool schema and handler
export const supabaseMcpTool = {
  // Schema definition for the tool
  schema: {
    name: "supabase_query",
    description: "Execute queries against the Supabase PostgreSQL database",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["query", "insert", "update", "delete", "test_connection"],
          description: "The operation to perform on the database"
        },
        // For query operations
        table: {
          type: "string",
          description: "The table to query or modify"
        },
        select: {
          type: "string",
          description: "Columns to select (comma-separated). Default is '*'"
        },
        filter: {
          type: "object",
          description: "Filter criteria as key-value pairs. Supports operators using nested objects: {field: {operator: value}}"
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return"
        },
        offset: {
          type: "number",
          description: "Number of records to skip"
        },
        order: {
          type: "object",
          properties: {
            column: { type: "string" },
            ascending: { type: "boolean" }
          },
          description: "Ordering specification"
        },
        // For insert operations
        data: {
          type: ["object", "array"],
          description: "Data to insert or update (object or array of objects)"
        },
        // For all operations
        returnData: {
          type: "boolean",
          description: "Whether to return the affected data"
        }
      },
      required: ["operation"]
    }
  },
  
  // Handler function for the tool
  async handler(params: any) {
    try {
      log.info(`[MCP-Supabase] Processing ${params.operation} operation`);
      
      switch (params.operation) {
        case "query":
          if (!params.table) {
            return { error: "Table parameter is required for query operations" };
          }
          return await executeQuery({
            table: params.table,
            select: params.select,
            filter: params.filter,
            limit: params.limit,
            offset: params.offset,
            order: params.order,
            join: params.join
          });
          
        case "insert":
          if (!params.table || !params.data) {
            return { error: "Table and data parameters are required for insert operations" };
          }
          return await insertData({
            table: params.table,
            data: params.data,
            returnData: params.returnData
          });
          
        case "update":
          if (!params.table || !params.data || !params.filter) {
            return { error: "Table, data, and filter parameters are required for update operations" };
          }
          return await updateData({
            table: params.table,
            data: params.data,
            filter: params.filter,
            returnData: params.returnData
          });
          
        case "delete":
          if (!params.table || !params.filter) {
            return { error: "Table and filter parameters are required for delete operations" };
          }
          return await deleteData({
            table: params.table,
            filter: params.filter,
            returnData: params.returnData
          });
          
        case "test_connection":
          return await testConnection();
          
        default:
          return { 
            error: `Unsupported operation: ${params.operation}`,
            supportedOperations: ["query", "insert", "update", "delete", "test_connection"]
          };
      }
    } catch (error) {
      log.error(`[MCP-Supabase] Tool execution error`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

// Export all available MCP tools
export const mcpTools = {
  supabase_query: supabaseMcpTool
};