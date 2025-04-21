import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { format, subDays, isWithinInterval } from 'date-fns';
import { normalizeGenre } from '@/lib/genreMapping';
import { GENRE_COLORS } from '@/lib/constants/colors';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Define interfaces for typed Spotify data
interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  popularity?: number;
}

interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

interface GenreData {
  name: string;
  count: number;
  color: string;
}

/**
 * GET handler for genre distribution data
 */
export async function GET(request: Request) {
  console.log("=== GENRE DISTRIBUTION API CALLED ===");
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get date range from URL params
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = timeRange === 'month' 
      ? subDays(endDate, 30) 
      : subDays(endDate, 7);
    
    console.log(`Analyzing genre distribution from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // Get user with Spotify account info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: 'spotify' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Make sure the user has a Spotify account
    if (!user.accounts || user.accounts.length === 0) {
      return NextResponse.json({ 
        error: "No Spotify account linked",
        message: "Connect your Spotify account to see your genre distribution.",
        genreDistribution: getDefaultGenreData(true),
        status: 'no-account'
      }, { status: 200 });
    }

    const spotifyAccount = user.accounts[0];
    
    // === APPROACH 1: FETCH DIRECT FROM SPOTIFY API ===
    if (spotifyAccount.access_token) {
      try {
        console.log("Connecting to Spotify API...");
        
        // Initialize Spotify API client
        const spotifyApi = SpotifyApi.withAccessToken(
          process.env.SPOTIFY_CLIENT_ID!,
          {
            access_token: spotifyAccount.access_token,
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: spotifyAccount.refresh_token || "",
          }
        );
        
        // === STEP 1: GET RECENTLY PLAYED TRACKS ===
        console.log("Fetching recently played tracks from Spotify API...");
        const recentlyPlayedResponse = await spotifyApi.player.getRecentlyPlayedTracks(50);
        const allTracks = recentlyPlayedResponse.items || [];
        
        console.log(`Fetched ${allTracks.length} recent tracks from Spotify API`);
        
        // Filter tracks by date range
        const tracksInRange = allTracks.filter(item => {
          const playedAt = new Date(item.played_at);
          return isWithinInterval(playedAt, { start: startDate, end: endDate });
        });
        
        console.log(`${tracksInRange.length} tracks fall within the selected date range`);
        
        if (tracksInRange.length === 0) {
          console.log("No recently played tracks in the selected date range");
          return NextResponse.json({
            genreDistribution: getDefaultGenreData(false),
            message: "No listening data found for the selected period.",
            status: 'empty'
          });
        }
        
        // === STEP 2: GET UNIQUE ARTISTS AND TRACKS ===
        const artists = new Map<string, SpotifyArtist>();
        const tracks = new Map<string, { track: SpotifyTrack, playCount: number }>();
        
        // Count track plays and collect unique artists
        tracksInRange.forEach(item => {
          // Track the track (with play count)
          const trackId = item.track.id;
          if (tracks.has(trackId)) {
            const trackData = tracks.get(trackId)!;
            trackData.playCount++;
          } else {
            tracks.set(trackId, { track: item.track, playCount: 1 });
          }
          
          // Track unique artists
          item.track.artists.forEach(artist => {
            if (!artists.has(artist.id)) {
              artists.set(artist.id, artist);
            }
          });
        });
        
        console.log(`Found ${tracks.size} unique tracks played ${tracksInRange.length} times`);
        console.log(`Found ${artists.size} unique artists`);
        
        // === STEP 3: FETCH ARTIST GENRES ===
        const artistIds = Array.from(artists.keys());
        const artistGenres = new Map<string, string[]>();
        
        // Fetch artist details in batches (Spotify API limit is 50)
        const batchSize = 50;
        for (let i = 0; i < artistIds.length; i += batchSize) {
          const batch = artistIds.slice(i, i + batchSize);
          console.log(`Fetching details for artist batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(artistIds.length/batchSize)}`);
          
          try {
            const artistsResponse = await spotifyApi.artists.get(batch);
            
            // Store each artist's genres
            artistsResponse.forEach(artist => {
              if (artist.genres && artist.genres.length > 0) {
                artistGenres.set(artist.id, artist.genres);
                console.log(`Artist "${artist.name}" has genres: ${artist.genres.join(', ')}`);
              } else {
                console.log(`Artist "${artist.name}" has no genres from Spotify`);
                // If no genres from Spotify, try to determine from name
                const inferredGenre = inferGenreFromName(artist.name);
                if (inferredGenre) {
                  artistGenres.set(artist.id, [inferredGenre]);
                  console.log(`Inferred genre "${inferredGenre}" for artist "${artist.name}"`);
                }
              }
            });
          } catch (error) {
            console.error(`Error fetching artist batch:`, error);
          }
        }
        
        console.log(`Successfully fetched genres for ${artistGenres.size}/${artists.size} artists`);
        
        // === STEP 4: CALCULATE GENRE DISTRIBUTION ===
        const genreCounts: Record<string, number> = {};
        const trackGenres = new Map<string, string[]>();
        
        // Associate genres with each track
        tracks.forEach((trackData, trackId) => {
          const track = trackData.track;
          const playCount = trackData.playCount;
          
          // Get all genres from all artists on this track
          const genres: string[] = [];
          track.artists.forEach(artist => {
            const artistGenreList = artistGenres.get(artist.id);
            if (artistGenreList && artistGenreList.length > 0) {
              genres.push(...artistGenreList);
            }
          });
          
          // Normalize and deduplicate genres
          const normalizedGenres = [...new Set(genres)]
            .map(g => normalizeGenre(g))
            .filter(Boolean);
          
          // Store the track's genres
          if (normalizedGenres.length > 0) {
            trackGenres.set(trackId, normalizedGenres);
            
            // Update genre counts based on play count
            normalizedGenres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + playCount;
            });
          }
        });
        
        // Create genre distribution data sorted by count
        const genreDistribution = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({
            name,
            count,
            color: getGenreColor(name)
          }));
        
        console.log("Genre distribution calculated:", 
          genreDistribution.slice(0, 5).map(g => `${g.name}: ${g.count}`).join(', ')
        );
        
        // === STEP 5: RETURN THE RESULTS ===
        if (genreDistribution.length > 0) {
          return NextResponse.json({
            genreDistribution,
            trackCount: tracksInRange.length,
            uniqueTracks: tracks.size,
            uniqueArtists: artists.size,
            timeRange,
            source: 'spotify-api',
            status: 'success'
          });
        } else {
          console.log("No genres found in the track data");
          return NextResponse.json({
            genreDistribution: getDefaultGenreData(false),
            message: "Could not identify genres for your listening history.",
            status: 'no-genres'
          });
        }
      } catch (spotifyError) {
        console.error("Error fetching data from Spotify API:", spotifyError);
        // Fall back to database if Spotify API fails
      }
    }
    
    // === APPROACH 2: FETCH FROM DATABASE ===
    console.log("Falling back to database for listening history");
    try {
      const listeningHistory = await prisma.listeningHistory.findMany({
          where: {
            userId: user.id,
            playedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
          playedAt: 'desc',
          },
      });
      
      console.log(`Found ${listeningHistory.length} tracks in database listening history`);
      
      if (listeningHistory.length === 0) {
        return NextResponse.json({
          genreDistribution: getDefaultGenreData(false),
          message: "No listening data found for the selected period.",
          source: 'database',
          status: 'empty'
        });
      }
      
      // Process genre counts from database records
      const genreCounts: Record<string, number> = {};
      
      listeningHistory.forEach(record => {
        if (record.genre) {
          const genre = normalizeGenre(record.genre);
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });

      // Create genre distribution data
      const genreDistribution = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          color: getGenreColor(name)
        }));
      
      if (genreDistribution.length > 0) {
        return NextResponse.json({
          genreDistribution,
          trackCount: listeningHistory.length,
          source: 'database',
          status: 'success'
        });
      } else {
        return NextResponse.json({
          genreDistribution: getDefaultGenreData(false),
          message: "No genre data found in your listening history.",
          source: 'database',
          status: 'empty'
        });
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({
        error: "Database error",
        message: "Could not fetch your listening history.",
        genreDistribution: getDefaultGenreData(true),
        status: 'error'
      }, { status: 500 });
        }
  } catch (error) {
    console.error("Unexpected error in genre distribution API:", error);
          return NextResponse.json({ 
      error: "Failed to fetch genre distribution",
      message: "An unexpected error occurred. Please try again later.",
      genreDistribution: getDefaultGenreData(true),
      status: 'error'
    }, { status: 500 });
        }
      }
      
/**
 * Helper function to get default genre data for empty or error states
 */
function getDefaultGenreData(isError: boolean): GenreData[] {
  // For errors, use equal distributions to show there's an issue
  if (isError) {
    return [
      { name: 'pop', count: 10, color: GENRE_COLORS.pop },
      { name: 'rock', count: 10, color: GENRE_COLORS.rock },
      { name: 'electronic', count: 10, color: GENRE_COLORS.electronic },
      { name: 'rap', count: 10, color: GENRE_COLORS.rap },
      { name: 'r&b', count: 10, color: GENRE_COLORS.randb }
    ];
  }
  
  // For empty states, use a realistic but obviously sample distribution
  return [
    { name: 'pop', count: 35, color: GENRE_COLORS.pop },
    { name: 'rock', count: 25, color: GENRE_COLORS.rock },
    { name: 'rap', count: 20, color: GENRE_COLORS.rap },
    { name: 'electronic', count: 15, color: GENRE_COLORS.electronic },
    { name: 'r&b', count: 12, color: GENRE_COLORS.randb },
    { name: 'jazz', count: 8, color: GENRE_COLORS.jazz },
    { name: 'classical', count: 5, color: GENRE_COLORS.classical },
    { name: 'latin', count: 4, color: GENRE_COLORS.latin }
  ];
}

/**
 * Helper function to get color for a genre
 */
function getGenreColor(genre: string): string {
  // Use the predefined color if available
  if (genre in GENRE_COLORS) {
    return GENRE_COLORS[genre as keyof typeof GENRE_COLORS];
  }
  
  // Map some common variations
  if (genre === 'hip hop' || genre === 'hip-hop') return GENRE_COLORS.rap;
  if (genre === 'r&b' || genre === 'rnb') return GENRE_COLORS.randb;
  
  // Default to "other" color
  return GENRE_COLORS.other;
}

/**
 * Try to infer genre from artist name when Spotify doesn't provide genres
 */
function inferGenreFromName(artistName: string): string | null {
  const name = artistName.toLowerCase();
  
  // Keywords that might indicate genre
  if (name.includes('rap') || name.includes('mc ') || name.includes(' mc')) return 'rap';
  if (name.includes('dj ') || name.includes('producer')) return 'electronic';
  if (name.includes('rock') || name.includes('band')) return 'rock';
  if (name.includes('pop')) return 'pop';
  if (name.includes('jazz')) return 'jazz';
  if (name.includes('classical') || name.includes('orchestra') || name.includes('symphony')) return 'classical';
  if (name.includes('country')) return 'country';
  if (name.includes('folk')) return 'folk';
  
  return null;
} 