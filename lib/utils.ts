import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

/**
 * Normalizes tax details in billing address objects to ensure consistent string format
 * @param billingAddress The billing address object to normalize
 * @returns A new billing address object with normalized tax details
 */
export function normalizeTaxDetails(billingAddress: any) {
  if (!billingAddress) return billingAddress;
  
  return {
    ...billingAddress,
    taxDetails: billingAddress.taxDetails === true || billingAddress.taxDetails === "true" ? "true" : "false",
    organization: billingAddress.organization || "",
    taxId: billingAddress.taxId || "",
    localPickup: billingAddress.localPickup === true || billingAddress.localPickup === "true" ? "true" : "false"
  };
}

// Update the serializeForClient function to include all record fields including tracks and videos
export function serializeForClient<T extends Record<string, any>>(obj: T): T {
  // Create a clean object with only needed properties to avoid serialization issues
  const cleanObj = {
    id: obj.id,
    title: obj.title,
    artist: obj.artist,
    price: obj.price,
    shipping_price: obj.shipping_price,
    cover_image: obj.cover_image,
    condition: obj.condition,
    status: obj.status,
    label: obj.label,
    catalogNumber: obj.catalogNumber,
    release: obj.release,
    styles: obj.styles,
    format: obj.format,
    country: obj.country,
    released: obj.released,
    date_added: obj.date_added,
    genres: obj.genres,
    quantity_available: obj.quantity_available,
    weight: obj.weight,
    weight_unit: obj.weight_unit,
    format_quantity: obj.format_quantity,
    // Add the new fields for tracks and videos
    tracks: obj.tracks || [],
    videos: obj.videos || [],
  }

  // Direct object return is faster than JSON.parse(JSON.stringify())
  return cleanObj as T
}

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

// Add timeouts to fetch
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const { signal, ...fetchOptions } = options;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    const response = await fetch(url, { 
      ...fetchOptions, 
      signal: controller.signal 
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

// Keep track of rate limits per API endpoint with global circuit breaker
const rateLimitTracker: Record<string, { 
  reset: number, 
  remaining: number,
  lastCall: number,
  baseUrl: string,
  consecutiveErrors: number
}> = {};

// Global circuit breaker for extreme rate limiting
let globalCircuitBreakerUntil = 0;
let globalConsecutive429s = 0;

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {},
): Promise<Response> {
  const { retryOptions, ...fetchOptions } = options;
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000,
    timeout = 15000
  } = retryOptions || {};

  // Extract base URL for rate limiting purposes
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  
  // Check global circuit breaker first
  const now = Date.now();
  if (globalCircuitBreakerUntil > now) {
    const waitTime = globalCircuitBreakerUntil - now;
    if (waitTime > 30000) {
      // If circuit breaker is tripped for more than 30 seconds, just return a synthetic response
      // to prevent cascading failures
      console.warn(`Global circuit breaker active for ${baseUrl} - returning empty response`);
      
      // Create a synthetic empty response that indicates rate limiting
      const syntheticResponse = new Response(JSON.stringify({
        message: "Rate limit circuit breaker active",
        _circuit_breaker: true
      }), {
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          "Content-Type": "application/json",
          "X-Circuit-Breaker": "true"
        }
      });
      
      return syntheticResponse;
    } else {
      // Wait for circuit breaker to clear if it's a shorter time
      console.warn(`Global circuit breaker active for ${baseUrl} - waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));
    }
  }
  
  // Check if we need to respect a rate limit before making a request
  const rateLimitInfo = rateLimitTracker[baseUrl];
  if (rateLimitInfo) {
    // Respect the rate limit reset time
    if (rateLimitInfo.reset > now) {
      // Calculate wait time with 100ms buffer
      const waitTime = rateLimitInfo.reset - now + 100;
      if (waitTime > 0) {
        // If wait time is too long, use a synthetic response instead
        if (waitTime > 30000) {
          console.warn(`Endpoint-specific circuit breaker active for ${baseUrl} - returning empty response`);
          
          // Create a synthetic empty response that indicates rate limiting
          const syntheticResponse = new Response(JSON.stringify({
            message: "Rate limit wait time too long",
            _circuit_breaker: true
          }), {
            status: 429,
            statusText: "Too Many Requests",
            headers: {
              "Content-Type": "application/json",
              "X-Circuit-Breaker": "true"
            }
          });
          
          return syntheticResponse;
        }
        
        console.warn(`Rate limit wait: ${waitTime}ms for ${baseUrl}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Implement progressive slowdown as we hit more rate limits
    const slowdownTime = Math.min(200 + (rateLimitInfo.consecutiveErrors * 100), 2000);
    
    // Respect the minimum time between requests (at least slowdownTime between requests)
    const timeSinceLastCall = now - rateLimitInfo.lastCall;
    if (timeSinceLastCall < slowdownTime) {
      await new Promise(resolve => setTimeout(resolve, slowdownTime - timeSinceLastCall));
    }
  }

  let lastError: Error | null = null;
  let successfulResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Update last call time
      if (rateLimitTracker[baseUrl]) {
        rateLimitTracker[baseUrl].lastCall = Date.now();
      } else {
        rateLimitTracker[baseUrl] = {
          reset: 0,
          remaining: 100, // Assume 100 requests initially
          lastCall: Date.now(),
          baseUrl,
          consecutiveErrors: 0
        };
      }
      
      // Use fetchWithTimeout to prevent hanging requests
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      
      // Update rate limit tracking based on response headers
      const rateLimitRemaining = response.headers.get("X-Ratelimit-Remaining");
      const rateLimitReset = response.headers.get("X-Ratelimit-Reset");
      
      if (rateLimitRemaining !== null && rateLimitReset !== null) {
        const remaining = parseInt(rateLimitRemaining, 10);
        const reset = parseInt(rateLimitReset, 10) * 1000; // Convert to ms
        
        rateLimitTracker[baseUrl] = {
          ...rateLimitTracker[baseUrl],
          remaining,
          reset,
        };
      }

      if (response.status === 429) {
        // Track consecutive 429s globally
        globalConsecutive429s++;
        
        // If we're getting too many rate limits across the app, trip the global circuit breaker
        // Use a higher threshold to make the circuit breaker less aggressive
        if (globalConsecutive429s >= 20) {
          const circuitBreakerTime = Math.min(30000 * Math.pow(2, Math.floor(globalConsecutive429s / 20)), 120000);
          globalCircuitBreakerUntil = Date.now() + circuitBreakerTime;
          console.warn(`Global circuit breaker tripped for ${circuitBreakerTime}ms due to excessive rate limiting`);
        }
        
        // Handle rate limiting specifically
        const retryAfter = response.headers.get("Retry-After");
        let delay: number;
        
        if (retryAfter) {
          // Use server-provided retry delay
          delay = Number.parseInt(retryAfter, 10) * 1000;
          
          // Update rate limit tracker with increased backoff
          rateLimitTracker[baseUrl].reset = Date.now() + delay;
          rateLimitTracker[baseUrl].remaining = 0;
          rateLimitTracker[baseUrl].consecutiveErrors = (rateLimitTracker[baseUrl].consecutiveErrors || 0) + 1;
        } else {
          // Exponential backoff with jitter - more aggressive than before
          delay = Math.min(
            Math.pow(2, attempt) * baseDelay * 1.5 + Math.random() * 1000, 
            maxDelay
          );
          
          // Update rate limit tracker
          rateLimitTracker[baseUrl].reset = Date.now() + delay;
          rateLimitTracker[baseUrl].remaining = 0;
          rateLimitTracker[baseUrl].consecutiveErrors = (rateLimitTracker[baseUrl].consecutiveErrors || 0) + 1;
        }
        
        // Log rate limiting
        console.warn(`Rate limited for ${baseUrl} - waiting ${delay}ms before retry ${attempt+1}/${maxRetries}`);
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      // Reset consecutive errors count on success
      if (response.ok) {
        if (rateLimitTracker[baseUrl]) {
          rateLimitTracker[baseUrl].consecutiveErrors = 0;
        }
        globalConsecutive429s = 0;
      }

      // Check for server errors (5xx) which should be retried
      if (response.status >= 500 && response.status < 600) {
        // Server error - retry with backoff
        const delay = Math.min(Math.pow(2, attempt) * baseDelay + Math.random() * 200, maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Any other non-ok response that is not a server error is considered an error
      // but we'll return it instead of throwing so the caller can handle it
      return response;
      
    } catch (error) {
      lastError = error as Error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn(`Request to ${url} timed out after ${timeout}ms`);
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} retries: ${lastError.message}`);
      }

      // Exponential backoff with jitter - more aggressive on errors
      const delay = Math.min(
        Math.pow(2, attempt) * baseDelay * 1.5 + Math.random() * 1000, 
        maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we somehow got here without returning a response or throwing an error
  if (successfulResponse) {
    return successfulResponse;
  }
  
  throw lastError || new Error(`Unknown error fetching ${url}`);
}

export class BatchProcessor<T, R> {
  private batch: Array<{
    item: T
    resolve: (value: R) => void
    reject: (error: any) => void
    addedAt: number // Track when item was added to batch
  }> = []
  private processing = false
  private timer: NodeJS.Timeout | null = null
  private processingSince: number | null = null 
  // Map to cache previous results to avoid redundant API calls
  private resultCache = new Map<string, { result: R, timestamp: number }>()
  private currentProcessPromise: Promise<void> | null = null

  constructor(
    private readonly processFn: (items: T[]) => Promise<R[]>,
    private readonly options: {
      maxBatchSize?: number
      maxWaitTime?: number
      cacheKeyFn?: (item: T) => string // Function to generate cache keys
      cacheTTL?: number // Time in ms to keep cached results
      maxConcurrentBatches?: number // How many batches can be processed in parallel
    } = {},
  ) {}

  async add(item: T): Promise<R> {
    // Try cache first if cacheKeyFn is provided
    if (this.options.cacheKeyFn) {
      const cacheKey = this.options.cacheKeyFn(item)
      const cached = this.resultCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp < (this.options.cacheTTL || 60000))) {
        return cached.result
      }
    }

    return new Promise<R>((resolve, reject) => {
      this.batch.push({ 
        item, 
        resolve, 
        reject,
        addedAt: Date.now()
      })

      // Process batch if it's full
      if (this.batch.length >= (this.options.maxBatchSize || 10)) {
        this.scheduleProcessing()
      } 
      // Or if timer not set yet, set it
      else if (!this.timer) {
        this.timer = setTimeout(() => this.scheduleProcessing(), this.options.maxWaitTime || 1000)
      }
    })
  }

  private scheduleProcessing(): void {
    // If we're already processing and have hit the concurrent batch limit, just return
    const maxConcurrentBatches = this.options.maxConcurrentBatches || 1
    if (this.processing && maxConcurrentBatches <= 1) return
    
    // If we're processing (but allowed multiple concurrent batches)
    if (this.processing) {
      // We need to wait for current processing to complete
      if (this.currentProcessPromise) {
        this.currentProcessPromise.then(() => {
          if (this.batch.length > 0) {
            this.scheduleProcessing()
          }
        })
      }
      return
    }
    
    // Clear any pending timer
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    // Start processing
    this.process()
  }

  private async process(): Promise<void> {
    if (this.batch.length === 0) return

    this.processing = true
    this.processingSince = Date.now()
    
    // Take current batch, respecting maxBatchSize
    const maxBatchSize = this.options.maxBatchSize || 10
    const currentBatch = this.batch.slice(0, maxBatchSize)
    this.batch = this.batch.slice(maxBatchSize)

    // Create a promise for tracking completion
    this.currentProcessPromise = this.processCurrentBatch(currentBatch)
    await this.currentProcessPromise
    
    // After processing, check if we have more items
    this.processing = false
    this.processingSince = null
    this.currentProcessPromise = null
    
    if (this.batch.length > 0) {
      // Process the next batch after a small delay to avoid overwhelming the API
      setTimeout(() => this.process(), 50)
    }
  }
  
  private async processCurrentBatch(
    currentBatch: Array<{
      item: T
      resolve: (value: R) => void
      reject: (error: any) => void
      addedAt: number
    }>
  ): Promise<void> {
    try {
      // Get unique items based on cache key to avoid redundant API calls
      const uniqueItems: T[] = []
      const uniqueKeysMap = new Map<string, number>() // Map of cache key to index in uniqueItems
      const itemIndices = new Map<number, number[]>() // Map of uniqueItems index to currentBatch indices
      
      currentBatch.forEach((batchItem, batchIndex) => {
        let cacheKey: string | null = null
        
        if (this.options.cacheKeyFn) {
          cacheKey = this.options.cacheKeyFn(batchItem.item)
          
          // Check if we've already added this item to uniqueItems
          if (uniqueKeysMap.has(cacheKey)) {
            const uniqueIndex = uniqueKeysMap.get(cacheKey)!
            // Track that this batch item should use the result from the unique item
            const indices = itemIndices.get(uniqueIndex) || []
            indices.push(batchIndex)
            itemIndices.set(uniqueIndex, indices)
            return
          }
        }
        
        // Add this as a unique item
        const uniqueIndex = uniqueItems.length
        uniqueItems.push(batchItem.item)
        
        // Track that this batch item should use this unique item's result
        const indices = [batchIndex]
        itemIndices.set(uniqueIndex, indices)
        
        // Record cache key for deduplication
        if (cacheKey) {
          uniqueKeysMap.set(cacheKey, uniqueIndex)
        }
      })
      
      // Process the unique items
      const uniqueResults = await this.processFn(uniqueItems)
      
      // Cache results if caching is enabled
      if (this.options.cacheKeyFn) {
        uniqueItems.forEach((item, index) => {
          const cacheKey = this.options.cacheKeyFn!(item)
          this.resultCache.set(cacheKey, { 
            result: uniqueResults[index], 
            timestamp: Date.now() 
          })
        })
      }
      
      // Distribute results to all waiting batch items
      uniqueResults.forEach((result, uniqueIndex) => {
        const batchIndices = itemIndices.get(uniqueIndex) || []
        batchIndices.forEach(batchIndex => {
          currentBatch[batchIndex].resolve(result)
        })
      })
    } catch (error) {
      // Handle errors by rejecting all promises
      currentBatch.forEach(({ reject, item }) => {
        // Log error with item info
        console.error(`Batch processing error for item: ${JSON.stringify(item).slice(0, 100)}...`, error)
        reject(error)
      })
    }
    
    // Clean up old cache entries if cache is enabled
    if (this.options.cacheKeyFn && this.options.cacheTTL) {
      const now = Date.now()
      const ttl = this.options.cacheTTL
      
      for (const [key, { timestamp }] of this.resultCache.entries()) {
        if (now - timestamp > ttl) {
          this.resultCache.delete(key)
        }
      }
    }
  }
}

