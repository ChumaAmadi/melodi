import { RateLimiter } from 'limiter';

// Rate limiters (5 requests per second for each API)
const lastfmLimiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });
const geniusLimiter = new RateLimiter({ tokensPerInterval: 5, interval: "second" });

const USER_AGENT = 'Melodi/1.0.0';

// Debug environment variables
console.log('Environment check:', {
  hasLastFmKey: !!process.env.NEXT_PUBLIC_LASTFM_API_KEY,
  hasGeniusKey: !!process.env.NEXT_PUBLIC_GENIUS_API_KEY,
});

export async function makeLastfmRequest(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
  
  if (!apiKey) {
    console.error('Last.fm API key missing. Available env vars:', Object.keys(process.env));
    throw new Error('Last.fm API key not configured - Please check your .env file');
  }

  await lastfmLimiter.removeTokens(1);
  
  const queryParams = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json'
  });

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${queryParams.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for Last.fm API errors in response
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message || data.error}`);
    }

    return data;
  } catch (error) {
    console.error('Last.fm API request failed:', error);
    throw error;
  }
}

export async function makeGeniusRequest(endpoint: string, params?: Record<string, string>) {
  const apiKey = process.env.NEXT_PUBLIC_GENIUS_API_KEY;
  
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

export async function getTrackTags(artist: string, track: string) {
  try {
    const data = await makeLastfmRequest('', {
      method: 'track.getTopTags',
      artist,
      track
    });
    
    return data.toptags?.tag || [];
  } catch (error) {
    console.error('Error fetching track tags:', error);
    return [];
  }
}

export async function getArtistTags(artist: string) {
  try {
    const data = await makeLastfmRequest('', {
      method: 'artist.getTopTags',
      artist
    });
    
    return data.toptags?.tag || [];
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