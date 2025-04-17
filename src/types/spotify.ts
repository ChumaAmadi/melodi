export interface CacheStatus {
  lastUpdated: Date;
  isRefreshing: boolean;
}

export interface ListeningStats {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  topGenres: { genre: string; count: number }[];
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  total: number;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

export interface GenreCacheEntry {
  mainGenres: string[];
  subGenres: string[];
  timestamp: number;
}

export interface SpotifyLoadingProgress {
  total: number;
  processed: number;
  currentArtist: string;
}

export interface SpotifyErrorState {
  hasError: boolean;
  message: string;
  isRateLimited: boolean;
  retryAfter: number | null;
}

export interface TopItem {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  genre: string;
  subGenres: string[];
}

export interface TopPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  tracks: TopItem[];
} 