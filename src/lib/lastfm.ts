import axios from 'axios';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

interface LastFmArtistInfo {
  tags: string[];
  similar: string[];
}

export async function getArtistInfo(artistName: string): Promise<LastFmArtistInfo | null> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        method: 'artist.getinfo',
        artist: artistName,
        api_key: LASTFM_API_KEY,
        format: 'json'
      }
    });

    if (response.data?.artist) {
      const tags = response.data.artist.tags?.tag?.map((t: any) => t.name.toLowerCase()) || [];
      const similar = response.data.artist.similar?.artist?.map((a: any) => a.name) || [];
      
      return {
        tags,
        similar
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Last.fm artist info:', error);
    return null;
  }
}

// Cache for Last.fm responses
const lastfmCache = new Map<string, { data: LastFmArtistInfo, timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getCachedArtistInfo(artistName: string): Promise<LastFmArtistInfo | null> {
  const cacheKey = artistName.toLowerCase();
  const cached = lastfmCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const info = await getArtistInfo(artistName);
  if (info) {
    lastfmCache.set(cacheKey, {
      data: info,
      timestamp: Date.now()
    });
  }
  
  return info;
} 