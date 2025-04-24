import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { normalizeGenre, categorizeGenres, getRelatedGenres } from "./genreMapping";
import { detectArtistGenres } from './genre-detection';

const BASE_URL = 'https://api.spotify.com/v1';

async function getAccessToken(session: Session | null): Promise<string | null> {
  return session?.accessToken || null;
}

async function getArtistGenres(artistId: string, accessToken: string, artistName: string, trackName?: string): Promise<{ mainGenres: string[], subGenres: string[] }> {
  try {
    if (!artistName) {
      console.warn('Missing artist name for genre detection');
      return { mainGenres: ['other'], subGenres: [] };
    }

    console.log(`Getting genres for artist: ${artistName}`, {
      artistId,
      hasAccessToken: !!accessToken,
      trackName: trackName || 'N/A'
    });
    
    const genres = await detectArtistGenres(artistName);
    return {
      mainGenres: genres.slice(0, 2),
      subGenres: genres.slice(2)
    };
  } catch (error) {
    console.error('Error in getArtistGenres:', error);
    return { mainGenres: ['other'], subGenres: [] };
  }
}

async function saveTrackToHistory(track: any, userId: string, playedAt?: string) {
  try {
    if (!track?.name || !track?.artist) {
      console.error('Invalid track data for saving:', track);
      return null;
    }

    // Ensure genre is set
    const trackData = {
      ...track,
      genre: track.genre || 'other',
      subGenres: Array.isArray(track.subGenres) ? track.subGenres : []
    };

    console.log('Saving track to history:', {
      trackName: trackData.name,
      artist: trackData.artist,
      genre: trackData.genre,
      subGenres: trackData.subGenres,
      userId,
      playedAt
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/spotify/save-track', baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        track: trackData,
        userId,
        playedAt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to save track: ${errorData.error || response.statusText}`);
    }

    const savedTrack = await response.json();
    
    if (!savedTrack?.trackName) {
      console.error('Invalid response from save-track:', savedTrack);
      return null;
    }

    console.log('Successfully saved track:', {
      name: savedTrack.trackName,
      artist: savedTrack.artistName,
      genre: savedTrack.genre,
      subGenres: savedTrack.subGenres
    });

    return savedTrack;
  } catch (error) {
    console.error('Error saving track to history:', error);
    return null;
  }
}

export async function getTopTracks(session: Session | null, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term') {
  if (!session?.user) {
    console.error('No session user found');
    return null;
  }
  if (!session.accessToken) {
    console.error('No access token found in session');
    return null;
  }

  try {
    console.log('Fetching top tracks with access token:', session.accessToken.substring(0, 10) + '...');
    const response = await fetch(`${BASE_URL}/me/top/tracks?limit=10&time_range=${timeRange}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch top tracks:', error);
      throw new Error(`Failed to fetch top tracks: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw top tracks response:', {
      total: data.total,
      limit: data.limit,
      offset: data.offset,
      itemCount: data.items.length
    });

    // Get track IDs from the response
    const trackIds = data.items.map((track: any) => track.id).filter(Boolean);
    
    // Fetch play counts from server API
    let playCountMap = new Map();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const countUrl = new URL('/api/spotify/track-counts', baseUrl);
      
      const countResponse = await fetch(countUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackIds }),
        credentials: 'include'
      });
      
      if (countResponse.ok) {
        const countsData = await countResponse.json();
        // Convert to Map
        if (Array.isArray(countsData)) {
          countsData.forEach(item => {
            playCountMap.set(item.trackId, item.count);
          });
        }
        console.log('Play count map created with', playCountMap.size, 'entries');
      } else {
        console.error('Error fetching play counts:', countResponse.status, countResponse.statusText);
      }
    } catch (countError) {
      console.error('Error fetching play counts:', countError);
    }

    // Fetch genres for each track's artist
    const tracksWithGenres = await Promise.all(
      data.items.map(async (track: any) => {
        if (!track?.artists?.[0]?.name || !track?.name) {
          console.warn('Invalid track data:', track);
          return null;
        }

        console.log('Processing track:', {
          name: track.name,
          artist: track.artists[0].name,
          id: track.id
        });
        
        const { mainGenres, subGenres } = await getArtistGenres(
          track.artists[0].id,
          session.accessToken as string,
          track.artists[0].name,
          track.name
        );

        const processedTrack = {
          id: track.id || 'unknown',
          name: track.name,
          artist: track.artists[0].name,
          album: track.album?.name || 'Unknown Album',
          albumArt: track.album?.images?.[0]?.url,
          playCount: playCountMap.get(track.id) || 1, // Default to 1 instead of 0 for better UX
          genre: mainGenres[0] || 'other',
          subGenres: [...new Set([...mainGenres.slice(1), ...subGenres])], // Remove duplicates
          duration_ms: track.duration_ms || 210000 // Default to 3.5 minutes (210 seconds) if duration not available
        };

        try {
          await saveTrackToHistory(processedTrack, session.user.id);
        } catch (saveError) {
          console.error('Failed to save track:', {
            track: processedTrack,
            error: saveError
          });
        }

        return processedTrack;
      })
    ).then(tracks => tracks.filter(Boolean)); // Remove null values

    console.log('Processed tracks with genres:', tracksWithGenres.length);
    return tracksWithGenres;
  } catch (error) {
    console.error('Error in getTopTracks:', error);
    return null;
  }
}

export async function getRecentlyPlayed(session: Session | null) {
  if (!session?.user) return null;
  if (!session.accessToken) {
    console.error('No access token found in session');
    return null;
  }

  try {
    console.log('Fetching recently played tracks...');
    const response = await fetch(`${BASE_URL}/me/player/recently-played?limit=50`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch recently played:', error);
      throw new Error(`Failed to fetch recently played: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Recently played tracks fetched:', data.items.length);

    // Fetch genres for each track's artist
    const tracksWithGenres = await Promise.all(
      data.items.map(async (item: any) => {
        if (!item?.track?.artists?.[0]?.name || !item?.track?.name) {
          console.warn('Invalid track data:', item);
          return null;
        }

        const { mainGenres, subGenres } = await getArtistGenres(
          item.track.artists[0].id,
          session.accessToken as string,
          item.track.artists[0].name,
          item.track.name
        );

        const processedTrack = {
          id: item.track.id || 'unknown',
          name: item.track.name,
          artist: item.track.artists[0].name,
          album: item.track.album?.name || 'Unknown Album',
          albumArt: item.track.album?.images?.[0]?.url,
          playedAt: item.played_at,
          genre: mainGenres[0] || 'other',
          subGenres: [...new Set([...mainGenres.slice(1), ...subGenres])], // Remove duplicates
          duration_ms: item.track.duration_ms || 210000 // Default to 3.5 minutes if not available
        };

        // Save to listening history with enhanced genre information
        await saveTrackToHistory(processedTrack, session.user.id, item.played_at);

        return processedTrack;
      })
    ).then(tracks => tracks.filter(Boolean)); // Remove null values

    return tracksWithGenres;
  } catch (error) {
    console.error('Error in getRecentlyPlayed:', error);
    return null;
  }
}

export type TopItem = {
  id: string;
  name: string;
  image?: string;
  count: number;
  artist?: string; // Optional artist field for albums
};

export type TopPlaylist = {
  id: string;
  name: string;
  image?: string;
  trackCount: number;
  owner: string;
};

export async function getTopPlaylists(session: Session | null): Promise<TopPlaylist[] | null> {
  if (!session) return null;

  try {
    const accessToken = await getAccessToken(session);
    if (!accessToken) return null;

    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=5', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch playlists:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.items.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      image: playlist.images[0]?.url,
      trackCount: playlist.tracks.total,
      owner: playlist.owner.display_name || playlist.owner.id,
    }));
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return null;
  }
}

export function processRecentlyPlayed(tracks: any[]) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter tracks from the last 7 days
  const recentTracks = tracks.filter(track => 
    new Date(track.playedAt) > oneWeekAgo
  );

  // Process albums
  const albumsMap = new Map<string, TopItem>();
  recentTracks.forEach(track => {
    const key = `${track.album}-${track.artist}`;
    if (!albumsMap.has(key)) {
      albumsMap.set(key, {
        id: key,
        name: track.album,
        image: track.albumArt,
        count: 1,
        artist: track.artist // Add artist name to album data
      });
    } else {
      const album = albumsMap.get(key)!;
      album.count++;
    }
  });

  // Process artists
  const artistsMap = new Map<string, TopItem>();
  recentTracks.forEach(track => {
    if (!artistsMap.has(track.artist)) {
      artistsMap.set(track.artist, {
        id: track.artist,
        name: track.artist,
        image: track.albumArt,
        count: 1
      });
    } else {
      const artist = artistsMap.get(track.artist)!;
      artist.count++;
      // Update artist image if not set
      if (!artist.image) {
        artist.image = track.albumArt;
      }
    }
  });

  // Convert to arrays and sort by count
  const topAlbums = Array.from(albumsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Show top 10 albums instead of 5

  const topArtists = Array.from(artistsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topAlbums,
    topArtists,
    recentTracks,
    timestamp: now.getTime() // Add timestamp for cache validation
  };
}

export async function fetchUserData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/spotify/user-data', baseUrl);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export const serverFunctions = {
  getTopTracks,
  getRecentlyPlayed,
  getUserProfile,
  getTopArtists,
  getListeningStats: async (userId: string, timePeriod?: 'day' | 'week' | 'month' | 'year' | 'all') => {
    try {
      // Default to all-time if not specified
      timePeriod = timePeriod || 'all';
      
      // Calculate date ranges based on time period
      let dateFilter: any = {};
      const now = new Date();
      let startDate: Date = new Date(0); // Default to beginning of time

      if (timePeriod !== 'all') {
        switch (timePeriod) {
          case 'day':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0); // Start of today
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        dateFilter = {
          createdAt: {
            gte: startDate
          }
        };
      }
      
      // Format date for debugging
      const startDateStr = startDate.toISOString();
      console.log(`Calculating ${timePeriod} listening stats for user ${userId} since ${startDateStr}`);

      try {
        // DEBUGGING: Execute a count query first to verify filtering is working
        const countResult = await prisma.listeningHistory.count({
          where: {
            userId,
            ...(timePeriod !== 'all' ? { createdAt: { gte: startDate } } : {})
          }
        });
        
        console.log(`Found ${countResult} records for time period ${timePeriod}`);
        
        // Direct query using parameterized query with explicit date format
        // Postgres requires ISO format dates in queries
        let query = `
          SELECT COALESCE(SUM(duration), 0) as totalduration, COUNT(*) as totalcount
          FROM "ListeningHistory"
          WHERE "userId" = $1
        `;

        // Add date filter if needed with explicit date formatting
        let queryParams: any[] = [userId];
        if (timePeriod !== 'all') {
          query += ` AND "createdAt" >= $2::timestamp`;
          queryParams.push(startDateStr);
          console.log(`Filtering by date >= ${startDateStr} (Params: ${queryParams.join(', ')})`);
        }

        const durationSumResult = await prisma.$queryRawUnsafe(query, ...queryParams);
        
        console.log("Duration query result:", JSON.stringify(durationSumResult, null, 2));
        
        const totalDuration = Number(durationSumResult[0]?.totalduration || 0);
        const totalTracksFromRaw = Number(durationSumResult[0]?.totalcount || 0);
        
        // Calculate total listening time in minutes, then convert to hours
        // Assuming duration is stored in seconds in the database
        const totalMinutes = Math.round(totalDuration / 60);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;  // Round to 1 decimal place
        
        // Get most played genre for the time period
        const genreCounts = await prisma.listeningHistory.groupBy({
          by: ['genre'],
          where: { 
            userId,
            ...(timePeriod !== 'all' ? { createdAt: { gte: startDate } } : {})
          },
          _count: { id: true },
          orderBy: {
            _count: { id: 'desc' }
          },
          take: 1
        });
        
        const topGenre = genreCounts[0]?.genre || '';
        
        console.log(`${timePeriod} stats calculated:`, { 
          totalTracks: totalTracksFromRaw, 
          totalMinutes, 
          totalHours, 
          totalDuration,
          topGenre,
          timeFilterApplied: timePeriod !== 'all'
        });
        
        return {
          totalTracks: totalTracksFromRaw,
          totalMinutes,
          totalHours,
          topGenre,
          timePeriod
        };
      } catch (error) {
        console.error(`Error in SQL query:`, error);
        return {
          totalTracks: 0,
          totalMinutes: 0,
          totalHours: 0,
          topGenre: '',
          timePeriod: timePeriod || 'all'
        };
      }
    } catch (error) {
      console.error(`Error calculating ${timePeriod || 'all-time'} listening stats:`, error);
      return {
        totalTracks: 0,
        totalMinutes: 0,
        totalHours: 0,
        topGenre: '',
        timePeriod: timePeriod || 'all'
      };
    }
  }
};

// Get the user's Spotify profile 
export async function getUserProfile(session: Session | null) {
  if (!session?.user) {
    console.error('No session user found');
    return null;
  }
  if (!session.accessToken) {
    console.error('No access token found in session');
    return null;
  }

  try {
    console.log('Fetching Spotify user profile...');
    const response = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Spotify user profile fetched successfully with image URLs:', data.images?.length || 0);
    
    return {
      id: data.id,
      name: data.display_name,
      email: data.email,
      images: data.images || [],
      country: data.country,
      profileUrl: data.external_urls?.spotify,
      followers: data.followers?.total || 0
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

// Get user's top artists
export async function getTopArtists(session: Session | null, limit: number = 5, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term') {
  if (!session?.user) {
    console.error('No session user found');
    return null;
  }
  if (!session.accessToken) {
    console.error('No access token found in session');
    return null;
  }

  try {
    console.log('Fetching top artists...');
    const response = await fetch(`${BASE_URL}/me/top/artists?limit=${limit}&time_range=${timeRange}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch top artists:', error);
      throw new Error(`Failed to fetch top artists: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Top artists fetched:', data.items.length);

    return data.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      images: artist.images || [],
      genres: artist.genres || [],
      popularity: artist.popularity,
      uri: artist.uri
    }));
  } catch (error) {
    console.error('Error in getTopArtists:', error);
    return null;
  }
} 