export interface TopItem {
  id: string;
  name: string;
  image?: string;
  count: number;
  artist?: string;
}

export interface TopPlaylist {
  id: string;
  name: string;
  image?: string;
  trackCount: number;
  owner: string;
}

export interface Stats {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  topGenres: Record<string, number>;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  playCount?: number;
  playedAt?: string;
}

// Client-side error state tracking
let errorState = {
  hasError: false,
  message: '',
  isRateLimited: false,
  retryAfter: null as number | null
};

export function getErrorState() {
  return errorState;
}

export async function fetchUserData() {
  try {
    const response = await fetch('/api/spotify/user-data');
    if (!response.ok) {
      const data = await response.json();
      errorState = {
        hasError: true,
        message: data.error || 'Failed to fetch data',
        isRateLimited: response.status === 429,
        retryAfter: null
      };
      throw new Error(data.error || 'Failed to fetch data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
} 