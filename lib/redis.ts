import { createClient } from "redis"
import { log } from "./logger"

// Check if Redis is enabled via environment variable (default: true)
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false"

// Get Redis URL from environment variable, fall back to localhost in development
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

// Only create Redis client if enabled
const redisClient = REDIS_ENABLED 
  ? createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff with max delay of 10 seconds
          return Math.min(retries * 500, 10000);
        },
        connectTimeout: 10000, // 10 seconds connection timeout
      }
    })
  : null

// Track Redis connection state
let redisConnected = false;

// Set up error handling if Redis is enabled
if (redisClient) {
  redisClient.on("error", (err) => {
    redisConnected = false;
    log("Redis Client Error", err, "error")
  })
  
  redisClient.on("connect", () => {
    redisConnected = true;
    log("Redis connected", {}, "info")
  })
  
  redisClient.on("reconnecting", () => {
    log("Redis reconnecting...", {}, "info")
  })
}

// Initialize connection only once and reuse
let connectionPromise: Promise<void> | null = null;

export function ensureConnection() {
  // If Redis is disabled or client not created, return immediately
  if (!redisClient) {
    return Promise.resolve();
  }
  
  // Return immediately if already connected
  if (redisConnected && redisClient.isReady) {
    return Promise.resolve();
  }
  
  // Only connect if we haven't tried yet and aren't already connected
  if (!connectionPromise && !redisClient.isReady) {
    log(`Connecting to Redis at ${REDIS_URL}`, {}, "info");
    connectionPromise = redisClient.connect()
      .then(() => {
        redisConnected = true;
        log("Successfully connected to Redis", {}, "info");
      })
      .catch((err) => {
        redisConnected = false;
        log("Failed to connect to Redis", err, "error");
        // Continue without Redis
        log("Continuing without Redis caching...", {}, "warn");
      });
  }
  return connectionPromise || Promise.resolve();
}

// Connect on module initialization
ensureConnection();

// In-memory cache for frequently accessed data
const memoryCache: Map<string, { value: string, expiry: number }> = new Map();

export async function getCachedData(key: string) {
  try {
    // Check memory cache first
    const memoryCached = memoryCache.get(key);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return memoryCached.value;
    } else if (memoryCached) {
      // Clean up expired items
      memoryCache.delete(key);
    }
    
    // If Redis is disabled, return null immediately
    if (!redisClient) return null;
    
    // Don't await connection if not ready - use memory cache as fallback
    if (!redisConnected) {
      ensureConnection().catch(() => {}); // Start connection in background
      return null;
    }
    
    // Quick check if client is ready
    if (!redisClient.isReady) return null;
    
    const value = await redisClient.get(key);
    
    // Store in memory cache for future access (60 second TTL)
    if (value) {
      memoryCache.set(key, { 
        value, 
        expiry: Date.now() + 60000 // 60 second TTL for memory cache
      });
    }
    
    return value;
  } catch (error) {
    log("Error getting cached data", error, "warn");
    return null;
  }
}

export async function setCachedData(key: string, value: string, ttl: number) {
  try {
    // Always set in memory cache regardless of Redis status
    memoryCache.set(key, {
      value,
      expiry: Date.now() + Math.min(ttl * 1000, 60000) // Use min of ttl or 60 seconds for memory
    });
    
    // If Redis is disabled, return immediately
    if (!redisClient) return;
    
    // Don't wait for connection if not ready
    if (!redisConnected) {
      ensureConnection().catch(() => {}); // Start connection in background
      return;
    }
    
    // Quick check if client is ready
    if (!redisClient.isReady) return;
    
    // Don't await this promise - fire and forget
    redisClient.set(key, value, { EX: ttl }).catch(error => {
      log("Error setting cached data", error, "warn");
    });
  } catch (error) {
    log("Error setting cached data", error, "warn");
    // Silently fail on cache errors
  }
}

export async function flushCache(pattern: string = "*") {
  return clearCachedData(pattern);
}

export async function clearCachedData(pattern: string = "*") {
  try {
    // Clear memory cache items that match pattern
    if (pattern === "*") {
      // Clear all memory cache
      memoryCache.clear();
    } else {
      // Convert Redis pattern to regex pattern
      const regexPattern = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      
      // Clear matching memory cache entries
      for (const key of memoryCache.keys()) {
        if (regexPattern.test(key)) {
          memoryCache.delete(key);
        }
      }
    }
    
    // If Redis is disabled, return after clearing memory cache
    if (!redisClient) return 0;
    
    await ensureConnection();
    if (!redisClient.isReady) return 0;
    
    // Handle single specific keys directly
    if (!pattern.includes('*')) {
      // This is a specific key, not a pattern
      const exists = await redisClient.exists(pattern);
      if (exists) {
        await redisClient.del(pattern);
        return 1;
      }
      return 0;
    }
    
    // Get all keys matching the pattern
    const keys = await redisClient.keys(pattern);
    
    // Delete all matching keys
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    return keys.length;
  } catch (error) {
    log("Error clearing cached data", error, "warn");
    return 0;
  }
}

export default redisClient

