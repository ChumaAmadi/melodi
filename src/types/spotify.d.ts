export interface CacheStatus {
  lastUpdate: Date;
  isRefreshing: boolean;
}

export interface ListeningStats {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  topGenres: { genre: string; count: number }[];
  timeOfDayStats: { hour: number; count: number }[];
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  total: number;
  message: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  retryCount: number;
  reject?: (reason?: any) => void;
}

export interface GenreCacheEntry {
  mainGenres: string[];
  subGenres: string[];
  timestamp: Date;
}

export interface SpotifyLoadingProgress {
  isLoading: boolean;
  progress: number;
  total: number;
  message: string;
}

export interface SpotifyErrorState {
  hasError: boolean;
  message: string;
}

export interface TopItem {
  id: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string | null;
  previewUrl: string | null;
  popularity: number;
  playedAt?: Date;
  count?: number;
}

export interface TopPlaylist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  owner: string;
} 