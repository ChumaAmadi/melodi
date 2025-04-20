import { RateLimiter } from 'limiter';

// Rate limiters (5 requests per second for each API)
const lastfmLimiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });
const geniusLimiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });

const USER_AGENT = 'Melodi/1.0.0';

// Debug environment variables
console.log('Environment check:', {
  hasLastFmKey: !!process.env.LASTFM_API_KEY,
  hasGeniusKey: !!process.env.GENIUS_API_KEY,
});

// Get Last.fm API key from environment
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

interface LastFMTag {
  name: string;
  url: string;
}

/**
 * Make a request to the Last.fm API with rate limiting
 */
export async function makeLastfmRequest(method: string, params: Record<string, string> = {}) {
  await lastfmLimiter.removeTokens(1);
  
  // Build URL for our server-side API endpoint
  const url = new URL('/api/lastfm', window.location.origin);
  url.searchParams.append('method', method);
  
  // Add all params to the URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Last.fm API request failed:', error);
    throw error;
  }
}

export async function makeGeniusRequest(endpoint: string, params?: Record<string, string>) {
  const apiKey = process.env.GENIUS_API_KEY;
  
  if (!apiKey) {
    console.error('Genius API key missing. Available env vars:', Object.keys(process.env));
    throw new Error('Genius API key not configured - Please check your .env file');
  }

  await geniusLimiter.removeTokens(1);
  
  const queryString = params ? `?${new URLSearchParams(params)}` : '';
  
  try {
    const response = await fetch(
      `https://api.genius.com${endpoint}${queryString}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': USER_AGENT
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Genius API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for Genius API errors in response
    if (data.error) {
      throw new Error(`Genius API error: ${data.error.message || data.error}`);
    }

    return data;
  } catch (error) {
    console.error('Genius API request failed:', error);
    throw error;
  }
}

/**
 * Get tags for a track from Last.fm
 */
export async function getTrackTags(artist: string, track: string): Promise<LastFMTag[]> {
  try {
    const data = await makeLastfmRequest('track.getInfo', {
      artist: artist,
      track: track
    });
    
    return data?.track?.toptags?.tag || [];
  } catch (error) {
    console.error('Error fetching track tags:', error);
    return [];
  }
}

/**
 * Get tags for an artist from Last.fm
 */
export async function getArtistTags(artist: string): Promise<LastFMTag[]> {
  try {
    const data = await makeLastfmRequest('artist.getTopTags', {
      artist: artist
    });
    
    return data?.toptags?.tag || [];
  } catch (error) {
    console.error('Error fetching artist tags:', error);
    return [];
  }
}

export async function getLyrics(artist: string, track: string) {
  try {
    // Search for the song
    const searchData = await makeGeniusRequest('/search', {
      q: `${track} ${artist}`
    });

    const hit = searchData.response.hits[0];
    if (!hit) return null;

    // Get song details including lyrics path
    const songData = await makeGeniusRequest(`/songs/${hit.result.id}`);
    
    return {
      url: songData.response.song.url,
      lyrics_state: songData.response.song.lyrics_state,
      path: songData.response.song.path
    };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
} 