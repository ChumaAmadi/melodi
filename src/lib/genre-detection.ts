import { getTrackTags, getArtistTags, makeLastfmRequest } from './api-utils';
import { normalizeGenre } from './genreMapping';
import { getGeniusLyrics } from '@/lib/genius';

// Define LastFM API key
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

// Common genre keywords and their associated genres
const GENRE_KEYWORDS: Record<string, string[]> = {
  rock: ['rock', 'punk', 'metal', 'grunge', 'indie', 'alternative', 'emo', 'post-rock', 'progressive'],
  electronic: ['electronic', 'edm', 'dubstep', 'house', 'techno', 'trance', 'drum and bass', 'dnb', 'electronic dance'],
  hiphop: ['hip hop', 'rap', 'trap', 'drill', 'grime', 'r&b', 'soul', 'urban'],
  jazz: ['jazz', 'swing', 'bebop', 'fusion', 'blues'],
  classical: ['classical', 'orchestra', 'symphony', 'chamber', 'baroque', 'romantic'],
  pop: ['pop', 'dance-pop', 'synth-pop', 'indie pop'],
  folk: ['folk', 'acoustic', 'traditional', 'americana', 'country'],
  experimental: ['experimental', 'avant-garde', 'noise', 'ambient', 'industrial'],
  latin: ['latin', 'salsa', 'reggaeton', 'merengue', 'samba', 'bossa nova'],
  world: ['world', 'ethnic', 'traditional', 'african', 'indian', 'celtic']
};

// In-memory cache
const genreCache: { [artistName: string]: { genres: string[], timestamp: number } } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

/**
 * Helper function to add delay between retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(fn: () => Promise<T>, name: string, maxRetries = MAX_RETRIES): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed for ${name}: ${error.message}`);
      
      // Check if we should retry based on error type
      if (error.status === 429 || // Too Many Requests
          error.status === 503 || // Service Unavailable
          error.status === 504 || // Gateway Timeout
          error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT') {
        
        // Add exponential backoff with jitter for retries
        const jitter = Math.random() * 0.3 + 0.85; // Between 0.85 and 1.15
        const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1) * jitter;
        
        console.log(`Retrying in ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      
      // Don't retry for client errors (4xx) except 429
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Get cached artist genres with graceful error handling
 */
export async function getCachedArtistGenres(artistName: string): Promise<string[]> {
  try {
    // First check memory cache
    const cached = genreCache[artistName];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.genres;
    }
    
    // Then check database cache using API endpoint instead of direct Prisma call
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = new URL(`/api/genre-cache`, baseUrl);
      url.searchParams.append('artist', encodeURIComponent(artistName));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Error fetching from genre cache API:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.genres && data.genres.length > 0) {
        // Update memory cache
        genreCache[artistName] = {
          genres: data.genres,
          timestamp: Date.now()
        };
        return data.genres;
      }
    } catch (error) {
      console.error('Error fetching from genre cache API:', error);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting cached artist genres:', error);
    return [];
  }
}

/**
 * Update artist genres in cache with error handling
 */
export async function updateArtistGenres(artistName: string, genres: string[]): Promise<void> {
  try {
    // Update memory cache
    genreCache[artistName] = {
      genres,
      timestamp: Date.now()
    };
    
    // Update database cache using API endpoint instead of direct Prisma call
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = new URL('/api/genre-cache', baseUrl);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistName,
          genres
        })
      });
      
      if (!response.ok) {
        console.error('Error updating genre cache in API:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating genre cache in API:', error);
    }
  } catch (error) {
    console.error('Error updating artist genres:', error);
    // Still store in memory cache even if API call fails
    genreCache[artistName] = {
      genres,
      timestamp: Date.now()
    };
  }
}

/**
 * Analyze text for genre keywords
 */
function analyzeTextForGenres(text: string): string[] {
  const genres = new Set<string>();
  const lowerText = text.toLowerCase();
  
  // Check for genre keywords in the text
  for (const [mainGenre, variations] of Object.entries(GENRE_KEYWORDS)) {
    if (variations.some(variation => lowerText.includes(variation))) {
      genres.add(mainGenre);
    }
  }

  return Array.from(genres);
}

/**
 * Extract genres from artist biography
 */
function extractGenresFromBio(bioText: string): string[] {
  const foundGenres = new Set<string>();
  const lowerBio = bioText.toLowerCase();

  // Look for genre keywords in the bio text
  for (const [mainGenre, variations] of Object.entries(GENRE_KEYWORDS)) {
    for (const keyword of variations) {
      if (lowerBio.includes(keyword)) {
        foundGenres.add(mainGenre);
        break;
      }
    }
  }

  return Array.from(foundGenres);
}

/**
 * Analyze lyrics using DeepSeek AI (if available)
 */
async function analyzeLyricsWithDeepSeek(lyrics: string): Promise<string[]> {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return [];
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a music genre analysis expert. Analyze the following lyrics and return ONLY the main genres that best describe the music. Return the genres as a comma-separated list.'
          },
          {
            role: 'user',
            content: lyrics
          }
        ]
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const genres = data.choices[0].message.content.split(',').map((g: string) => g.trim().toLowerCase());
      return genres.map((g: string) => normalizeGenre(g)).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Error analyzing lyrics with DeepSeek:', error);
    return [];
  }
}

/**
 * Main function to detect artist genres with robust error handling
 */
export async function detectArtistGenres(artistName: string): Promise<string[]> {
  if (!artistName) {
    console.warn('Missing artist name for genre detection');
    return [];
  }

  try {
    // Check cache first
    const cachedGenres = await getCachedArtistGenres(artistName);
    if (cachedGenres && cachedGenres.length > 0) {
      return cachedGenres;
    }

    // Try multiple methods to detect genres
    let detectedGenres: string[] = [];

    // 1. Try Last.fm artist tags first (most reliable)
    try {
      const artistTags = await withRetry(
        () => getArtistTags(artistName),
        'getArtistTags',
        2 // Fewer retries for this method
      );
      
      if (Array.isArray(artistTags) && artistTags.length > 0) {
        detectedGenres = artistTags
          .filter(tag => tag && tag.name)
          .map(tag => normalizeGenre(tag.name))
          .filter(Boolean);
      }
    } catch (error) {
      console.error('Error fetching Last.fm artist tags:', error);
      // Continue to next method
    }

    // 2. If no tags, use Last.fm API directly for artist info and bio
    if (detectedGenres.length === 0) {
      try {
        // Use makeLastfmRequest with retry
        const data = await withRetry(
          () => makeLastfmRequest('artist.getInfo', { artist: artistName }),
          'artist.getInfo'
        );
        
        if (data.artist) {
          // Extract genres from tags
          const tagGenres = data.artist.tags?.tag?.map((tag: any) => normalizeGenre(tag.name.toLowerCase())) || [];
          
          // Extract genres from bio
          const bioGenres = extractGenresFromBio(data.artist.bio?.summary || '');
          
          // Combine and deduplicate genres
          detectedGenres = Array.from(new Set([...tagGenres, ...bioGenres])).filter(Boolean);
        }
      } catch (error) {
        console.error('Error fetching Last.fm artist info:', error);
        // Continue to next method
      }
    }

    // 3. Try to extract genres from artist name
    if (detectedGenres.length === 0) {
      detectedGenres = analyzeTextForGenres(artistName);
    }

    // 4. As a last resort, try DeepSeek AI analysis
    if (detectedGenres.length === 0 && process.env.DEEPSEEK_API_KEY) {
      try {
        detectedGenres = await withRetry(
          () => analyzeLyricsWithDeepSeek(`Music by ${artistName}`),
          'analyzeLyricsWithDeepSeek'
        );
      } catch (error) {
        console.error('Error using DeepSeek for genre analysis:', error);
      }
    }

    // If we found genres, cache them
    if (detectedGenres.length > 0) {
      await updateArtistGenres(artistName, detectedGenres);
      return detectedGenres;
    }

    // Fallback to defaults if we couldn't detect any genres
    const fallbackGenres = ['pop']; // Default genre if detection fails completely
    await updateArtistGenres(artistName, fallbackGenres);
    return fallbackGenres;
  } catch (error) {
    console.error('Error detecting genres:', error);
    return ['other']; // Ultimate fallback
  }
}

/**
 * Update artist genres in database cache
 */
export async function updateArtistGenreCache(artistId: string, genres: string[]) {
  try {
    // Update the database cache using the API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/genre-cache', baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artistName: artistId,
        genres
      })
    });
    
    if (!response.ok) {
      console.error('Error updating genre cache in API:', response.statusText);
    }
  } catch (error) {
    console.error('Error updating artist genre cache:', error);
  }
} 