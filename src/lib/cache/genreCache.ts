import { prisma } from '@/lib/prisma';

interface GenreCacheEntry {
  genres: string[];
  lastUpdated: Date;
}

// For type safety
interface ArtistGenreCacheData {
  artistId: string;
  mainGenres: string[];
  subGenres: string[];
  lastUpdated: Date;
}

// Constants
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

// In-memory cache
const memoryCache = new Map<string, GenreCacheEntry>();

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Helper function to add delay between retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper for database operations
 */
async function withRetry<T>(fn: () => Promise<T>, operation: string, maxRetries = MAX_RETRIES): Promise<T> {
  // Skip database operations in browser
  if (isBrowser) {
    throw new Error('Database operations are not supported in browser environment');
  }

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed for ${operation}: ${error.message}`);
      
      // Add exponential backoff with jitter for retries
      const jitter = Math.random() * 0.3 + 0.85; // Between 0.85 and 1.15
      const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1) * jitter;
      
      console.log(`Retrying in ${Math.round(waitTime)}ms...`);
      await delay(waitTime);
    }
  }
  
  throw lastError;
}

/**
 * Get cached genres for an artist
 */
export async function getArtistGenres(artistId: string): Promise<string[]> {
  try {
    // Check memory cache first
    const memoryResult = memoryCache.get(artistId);
    if (memoryResult && Date.now() - memoryResult.lastUpdated.getTime() < CACHE_DURATION) {
      return memoryResult.genres;
    }

    // Skip database operations in browser
    if (isBrowser) {
      return [];
    }

    // Check database cache
    const dbCache = await withRetry(
      () => prisma.artistGenreCache.findUnique({
        where: { artistId },
      }),
      `get genres for artist ${artistId}`
    ) as ArtistGenreCacheData | null;

    if (dbCache && Date.now() - dbCache.lastUpdated.getTime() < CACHE_DURATION) {
      const genres = [...dbCache.mainGenres, ...dbCache.subGenres];
      
      // Update memory cache
      memoryCache.set(artistId, {
        genres,
        lastUpdated: dbCache.lastUpdated,
      });
      
      return genres;
    }

    return [];
  } catch (error) {
    console.error('Error accessing artist genre cache:', error);
    return [];
  }
}

/**
 * Update genres for an artist in the cache
 */
export async function setArtistGenres(
  artistId: string,
  genres: string[],
  options: { mainGenres?: string[], subGenres?: string[] } = {}
): Promise<void> {
  try {
    const { mainGenres = genres, subGenres = [] } = options;
    const cacheEntry = {
      genres,
      lastUpdated: new Date(),
    };

    // Update memory cache first
    memoryCache.set(artistId, cacheEntry);

    // Skip database operations in browser
    if (isBrowser) {
      return;
    }

    // Update database cache
    await withRetry(
      () => prisma.artistGenreCache.upsert({
        where: { artistId },
        create: {
          artistId,
          mainGenres,
          subGenres,
          lastUpdated: cacheEntry.lastUpdated,
        },
        update: {
          mainGenres,
          subGenres,
          lastUpdated: cacheEntry.lastUpdated,
        },
      }),
      `update genres for artist ${artistId}`
    );
  } catch (error) {
    console.error('Error updating artist genre cache:', error);
    // Still have the memory cache update from earlier
  }
}

/**
 * Invalidate cache entry for an artist
 */
export async function invalidateArtistGenres(artistId: string): Promise<void> {
  try {
    // Remove from memory cache
    memoryCache.delete(artistId);

    // Skip database operations in browser
    if (isBrowser) {
      return;
    }

    // Remove from database cache
    await withRetry(
      () => prisma.artistGenreCache.delete({
        where: { artistId },
      }),
      `invalidate genres for artist ${artistId}`
    );
  } catch (error) {
    console.error('Error invalidating artist genre cache:', error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupGenreCache(): Promise<void> {
  try {
    const expiryDate = new Date(Date.now() - CACHE_DURATION);

    // Cleanup memory cache
    for (const [artistId, cache] of memoryCache.entries()) {
      if (cache.lastUpdated < expiryDate) {
        memoryCache.delete(artistId);
      }
    }

    // Skip database operations in browser
    if (isBrowser) {
      return;
    }

    // Cleanup database cache
    await withRetry(
      () => prisma.artistGenreCache.deleteMany({
        where: {
          lastUpdated: {
            lt: expiryDate,
          },
        },
      }),
      'cleanup genre cache'
    );
  } catch (error) {
    console.error('Error cleaning up artist genre cache:', error);
  }
} 