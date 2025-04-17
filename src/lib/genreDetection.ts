import { getTrackTags, getArtistTags, getLyrics } from './api-utils';
import { normalizeGenre } from './genreMapping';
import { RateLimiter } from 'limiter';

interface GenreWeight {
  genre: string;
  weight: number;
  source: string;
}

// Create rate limiters for each API
const lastfmLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: 'second'
});

const spotifyLimiter = new RateLimiter({
  tokensPerInterval: 3,
  interval: 'second'
});

const geniusLimiter = new RateLimiter({
  tokensPerInterval: 3,
  interval: 'second'
});

// Cache for genre results to minimize API calls
const genreCache = new Map<string, { result: { mainGenres: string[]; subGenres: string[] }, timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function enhancedGenreDetection(
  track: string,
  artist: string,
  spotifyTrackId?: string
): Promise<{ mainGenres: string[]; subGenres: string[] }> {
  try {
    console.log(`Starting genre detection for artist: ${artist}`);
    
    // Check cache first
    const cacheKey = `${artist}-${track}`;
    const cachedResult = genreCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      console.log('Using cached genre data');
      return cachedResult.result;
    }
    
    const genreWeights: GenreWeight[] = [];
    
    // Only fetch artist tags first (50% weight)
    try {
      const artistTags = await getArtistTags(artist);
      if (artistTags.length > 0) {
        artistTags.forEach((tag: { name: string; count: number; }) => {
          const normalizedGenre = normalizeGenre(tag.name.toLowerCase());
          if (normalizedGenre !== 'other') {
            genreWeights.push({
              genre: normalizedGenre,
              weight: (tag.count / 100) * 0.5,
              source: 'lastfm_artist'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching artist tags:', error);
    }

    // If we don't have enough genre data from artist tags, try track tags
    if (genreWeights.length < 2 && track) {
      try {
        const trackTags = await getTrackTags(artist, track);
        if (trackTags.length > 0) {
          trackTags.forEach((tag: { name: string; count: number; }) => {
            const normalizedGenre = normalizeGenre(tag.name.toLowerCase());
            if (normalizedGenre !== 'other') {
              genreWeights.push({
                genre: normalizedGenre,
                weight: (tag.count / 100) * 0.3,
                source: 'lastfm_track'
              });
            }
          });
        }
      } catch (error) {
        console.error('Error fetching track tags:', error);
      }
    }

    // Only try lyrics analysis if we still don't have good genre data
    if (genreWeights.length < 2 && track) {
      try {
        const lyricsData = await getLyrics(artist, track);
        if (lyricsData?.url) {
          const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              track,
              artist,
              lyricsUrl: lyricsData.url
            })
          });

          if (response.ok) {
            const { genres } = await response.json();
            genres.forEach((genre: string) => {
              const normalizedGenre = normalizeGenre(genre.toLowerCase());
              if (normalizedGenre !== 'other') {
                genreWeights.push({
                  genre: normalizedGenre,
                  weight: 0.2 / genres.length,
                  source: 'deepseek'
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error analyzing with DeepSeek:', error);
      }
    }

    // If we still don't have any genres, try name-based detection
    if (genreWeights.length === 0) {
      console.log('No genres found, attempting name-based detection');
      const combinedText = `${track} ${artist}`.toLowerCase();
      const possibleGenre = normalizeGenre(combinedText);
      if (possibleGenre !== 'other') {
        genreWeights.push({
          genre: possibleGenre,
          weight: 1,
          source: 'name_analysis'
        });
      }
    }

    // Combine weights for same genres
    const genreCombined = new Map<string, number>();
    genreWeights.forEach(({ genre, weight }) => {
      genreCombined.set(genre, (genreCombined.get(genre) || 0) + weight);
    });

    // Sort genres by weight
    const sortedGenres = Array.from(genreCombined.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    // Ensure we always have at least one genre
    if (sortedGenres.length === 0) {
      sortedGenres.push('other');
    }

    const result = {
      mainGenres: sortedGenres.slice(0, 2),
      subGenres: sortedGenres.slice(2, 5)
    };

    // Cache the result
    genreCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error in genre detection:', error);
    return {
      mainGenres: ['other'],
      subGenres: []
    };
  }
} 