import { Session } from "next-auth";

const BASE_URL = 'https://api.spotify.com/v1';

export async function getTopTracks(session: Session | null, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term') {
  if (!session?.user) return null;
  if (!session.accessToken) {
    console.error('No access token found in session');
    return null;
  }

  try {
    console.log('Fetching top tracks...');
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
    console.log('Top tracks fetched:', data.items.length);
    return data.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url,
      playCount: 0, // We'll need to get this from recent plays
    }));
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
    return data.items.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0].name,
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url,
      playedAt: item.played_at,
    }));
  } catch (error) {
    console.error('Error in getRecentlyPlayed:', error);
    return null;
  }
}

interface TopItem {
  id: string;
  name: string;
  image: string;
  count: number;
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
        count: 1
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
    .slice(0, 5);

  const topArtists = Array.from(artistsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topAlbums,
    topArtists,
    recentTracks
  };
} 