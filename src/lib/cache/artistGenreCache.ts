import { prisma } from '@/lib/prisma';

interface CachedGenres {
  mainGenres: string[];
  subGenres: string[];
  lastUpdated: Date;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class ArtistGenreCache {
  private static memoryCache = new Map<string, CachedGenres>();

  static async get(artistId: string): Promise<CachedGenres | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(artistId);
    if (memoryResult && Date.now() - memoryResult.lastUpdated.getTime() < CACHE_DURATION) {
      return memoryResult;
    }

    try {
      // Check database cache
      const dbCache = await prisma.artistGenreCache.findUnique({
        where: { artistId },
      });

      if (dbCache && Date.now() - dbCache.lastUpdated.getTime() < CACHE_DURATION) {
        const result = {
          mainGenres: dbCache.mainGenres,
          subGenres: dbCache.subGenres,
          lastUpdated: dbCache.lastUpdated,
        };
        // Update memory cache
        this.memoryCache.set(artistId, result);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error accessing artist genre cache:', error);
      return null;
    }
  }

  static async set(
    artistId: string,
    genres: { mainGenres: string[]; subGenres: string[] }
  ): Promise<void> {
    const cacheEntry = {
      ...genres,
      lastUpdated: new Date(),
    };

    try {
      // Update database cache
      await prisma.artistGenreCache.upsert({
        where: { artistId },
        create: {
          artistId,
          mainGenres: genres.mainGenres,
          subGenres: genres.subGenres,
          lastUpdated: cacheEntry.lastUpdated,
        },
        update: {
          mainGenres: genres.mainGenres,
          subGenres: genres.subGenres,
          lastUpdated: cacheEntry.lastUpdated,
        },
      });

      // Update memory cache
      this.memoryCache.set(artistId, cacheEntry);
    } catch (error) {
      console.error('Error updating artist genre cache:', error);
    }
  }

  static async invalidate(artistId: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(artistId);

      // Remove from database cache
      await prisma.artistGenreCache.delete({
        where: { artistId },
      });
    } catch (error) {
      console.error('Error invalidating artist genre cache:', error);
    }
  }

  static async cleanup(): Promise<void> {
    try {
      const expiryDate = new Date(Date.now() - CACHE_DURATION);

      // Cleanup database cache
      await prisma.artistGenreCache.deleteMany({
        where: {
          lastUpdated: {
            lt: expiryDate,
          },
        },
      });

      // Cleanup memory cache
      for (const [artistId, cache] of this.memoryCache.entries()) {
        if (cache.lastUpdated < expiryDate) {
          this.memoryCache.delete(artistId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up artist genre cache:', error);
    }
  }
} 