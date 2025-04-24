import { getTrackTags, getArtistTags, makeLastfmRequest } from './api-utils';
import { normalizeGenre } from './genreMapping';
import { getGeniusLyrics } from '@/lib/genius';
import { getArtistGenres, setArtistGenres } from '@/lib/cache/genreCache';

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
    return [];
  }
  
  try {
    // Try to get cached genres first
    const cachedGenres = await getArtistGenres(artistName);
    if (cachedGenres.length > 0) {
      return cachedGenres;
    }

    // If not in cache, detect genres
    const genres: string[] = [];
    
    // Get genres from Last.fm
    try {
      const artistTags = await withRetry(
        () => getArtistTags(artistName),
        `get Last.fm tags for ${artistName}`
      );
      
      for (const tag of artistTags) {
        // Handle tag object - assuming tag.name is the genre name
        const normalizedGenre = normalizeGenre(typeof tag === 'string' ? tag : tag.name);
        if (normalizedGenre && !genres.includes(normalizedGenre)) {
          genres.push(normalizedGenre);
        }
      }
    } catch (error) {
      console.warn(`Error getting Last.fm tags for ${artistName}:`, error);
    }
    
    // Get artist bio for additional genre analysis
    try {
      const bioResponse = await withRetry(
        () => makeLastfmRequest('artist.getInfo', { artist: artistName }),
        `get Last.fm bio for ${artistName}`
      );
      
      if (bioResponse?.artist?.bio?.content) {
        const bioGenres = extractGenresFromBio(bioResponse.artist.bio.content);
        for (const genre of bioGenres) {
          if (!genres.includes(genre)) {
            genres.push(genre);
          }
        }
      }
    } catch (error) {
      console.warn(`Error getting Last.fm bio for ${artistName}:`, error);
    }
    
    // If we found genres, cache them and return
    if (genres.length > 0) {
      await setArtistGenres(artistName, genres);
      return genres;
    }
    
    // If still no genres, return empty array
    return [];
    
  } catch (error) {
    console.error(`Error detecting genres for ${artistName}:`, error);
    return [];
  }
}

/**
 * Update the genre cache for an artist
 */
export async function updateArtistGenreCache(artistId: string, genres: string[]): Promise<void> {
  await setArtistGenres(artistId, genres);
} 