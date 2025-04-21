'use client';

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { getTopTracks, getRecentlyPlayed, processRecentlyPlayed, getTopPlaylists } from "@/lib/spotify";
import MoodTimeline from "./MoodTimeline";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import MelodiChat from './MelodiChat';
import GenreDistribution from './GenreDistribution';
import ProfileMenu from './ProfileMenu';
import InsightHeader from './InsightHeader';
import { TopPlaylist } from '@/lib/spotify';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Doughnut } from "react-chartjs-2";
import { generateHeaderInsight } from "@/lib/deepseek";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  playCount?: number;
  playedAt?: string;
  genre?: string;
}

interface TopItem {
  id: string;
  name: string;
  image?: string;
  count: number;
  artist?: string;
}

interface MoodData {
  labels: string[];
  happy: number[];
  calm: number[];
  sad: number[];
  frustrated: number[];
  reflective: number[];
  inspired: number[];
}

interface GenreData {
  name: string;
  count: number;
  color: string;
}

interface DashboardProps {
  listeningHistory?: Track[];
}

const REFRESH_INTERVAL = 300000; // Refresh every 5 minutes

export default function Dashboard({ listeningHistory = [] }: DashboardProps) {
  const { data: session } = useSession();
  const [currentHistory, setCurrentHistory] = useState<Track[]>(listeningHistory);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topAlbums, setTopAlbums] = useState<TopItem[]>([]);
  const [topArtists, setTopArtists] = useState<TopItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<TopPlaylist[]>([]);
  const [genreData, setGenreData] = useState<{ 
    genreDistribution: GenreData[],
    correlationData: { genre: string; moods: { mood: string; strength: number; count: number }[] }[]
  }>({
    genreDistribution: [
      { name: 'Pop', count: 32, color: 'rgba(255, 92, 168, 0.85)' },
      { name: 'Rock', count: 24, color: 'rgba(164, 182, 255, 0.85)' },
      { name: 'Electronic', count: 18, color: 'rgba(46, 254, 200, 0.85)' },
      { name: 'Hip Hop', count: 15, color: 'rgba(255, 152, 0, 0.85)' },
      { name: 'R&B', count: 10, color: 'rgba(156, 39, 176, 0.85)' },
      { name: 'Jazz', count: 8, color: 'rgba(33, 150, 243, 0.85)' },
      { name: 'Classical', count: 7, color: 'rgba(76, 175, 80, 0.85)' },
      { name: 'Country', count: 6, color: 'rgba(255, 235, 59, 0.85)' },
      { name: 'Folk', count: 5, color: 'rgba(255, 87, 34, 0.85)' },
      { name: 'Metal', count: 12, color: 'rgba(33, 33, 33, 0.85)' },
      { name: 'Alternative', count: 14, color: 'rgba(96, 125, 139, 0.85)' },
      { name: 'Indie', count: 16, color: 'rgba(121, 85, 72, 0.85)' },
      { name: 'Soul', count: 9, color: 'rgba(244, 67, 54, 0.85)' },
      { name: 'Blues', count: 7, color: 'rgba(63, 81, 181, 0.85)' },
      { name: 'Reggae', count: 5, color: 'rgba(0, 150, 136, 0.85)' }
    ],
    correlationData: [
      {
        genre: 'Pop',
        moods: [
          { mood: 'Happy', strength: 0.7, count: 10 },
          { mood: 'Calm', strength: 0.4, count: 6 },
          { mood: 'Sad', strength: 0.1, count: 2 },
          { mood: 'Frustrated', strength: 0.1, count: 2 },
          { mood: 'Reflective', strength: 0.3, count: 5 },
          { mood: 'Inspired', strength: 0.6, count: 7 }
        ]
      },
      {
        genre: 'Rock',
        moods: [
          { mood: 'Happy', strength: 0.4, count: 6 },
          { mood: 'Calm', strength: 0.2, count: 3 },
          { mood: 'Sad', strength: 0.3, count: 4 },
          { mood: 'Frustrated', strength: 0.6, count: 8 },
          { mood: 'Reflective', strength: 0.4, count: 6 },
          { mood: 'Inspired', strength: 0.5, count: 7 }
        ]
      },
      {
        genre: 'Electronic',
        moods: [
          { mood: 'Happy', strength: 0.6, count: 8 },
          { mood: 'Calm', strength: 0.3, count: 4 },
          { mood: 'Sad', strength: 0.2, count: 3 },
          { mood: 'Frustrated', strength: 0.2, count: 3 },
          { mood: 'Reflective', strength: 0.3, count: 5 },
          { mood: 'Inspired', strength: 0.7, count: 9 }
        ]
      },
      {
        genre: 'Hip Hop',
        moods: [
          { mood: 'Happy', strength: 0.5, count: 7 },
          { mood: 'Calm', strength: 0.2, count: 3 },
          { mood: 'Sad', strength: 0.3, count: 4 },
          { mood: 'Frustrated', strength: 0.5, count: 7 },
          { mood: 'Reflective', strength: 0.4, count: 6 },
          { mood: 'Inspired', strength: 0.6, count: 8 }
        ]
      },
      {
        genre: 'R&B',
        moods: [
          { mood: 'Happy', strength: 0.4, count: 6 },
          { mood: 'Calm', strength: 0.6, count: 8 },
          { mood: 'Sad', strength: 0.3, count: 4 },
          { mood: 'Frustrated', strength: 0.1, count: 2 },
          { mood: 'Reflective', strength: 0.5, count: 7 },
          { mood: 'Inspired', strength: 0.4, count: 6 }
        ]
      },
      {
        genre: 'Jazz',
        moods: [
          { mood: 'Happy', strength: 0.5, count: 7 },
          { mood: 'Calm', strength: 0.7, count: 9 },
          { mood: 'Sad', strength: 0.2, count: 3 },
          { mood: 'Frustrated', strength: 0.1, count: 2 },
          { mood: 'Reflective', strength: 0.6, count: 8 },
          { mood: 'Inspired', strength: 0.5, count: 7 }
        ]
      },
      {
        genre: 'Classical',
        moods: [
          { mood: 'Happy', strength: 0.3, count: 4 },
          { mood: 'Calm', strength: 0.8, count: 10 },
          { mood: 'Sad', strength: 0.4, count: 5 },
          { mood: 'Frustrated', strength: 0.1, count: 2 },
          { mood: 'Reflective', strength: 0.7, count: 9 },
          { mood: 'Inspired', strength: 0.6, count: 8 }
        ]
      },
      {
        genre: 'Metal',
        moods: [
          { mood: 'Happy', strength: 0.3, count: 4 },
          { mood: 'Calm', strength: 0.1, count: 2 },
          { mood: 'Sad', strength: 0.3, count: 4 },
          { mood: 'Frustrated', strength: 0.8, count: 10 },
          { mood: 'Reflective', strength: 0.3, count: 4 },
          { mood: 'Inspired', strength: 0.5, count: 7 }
        ]
      }
    ]
  });
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(true);
  const [moodDataError, setMoodDataError] = useState<string | null>(null);
  const [isLoadingGenreData, setIsLoadingGenreData] = useState(false);
  const [genreDataError, setGenreDataError] = useState<string | null>(null);
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true);
  const [isLoadingTopAlbums, setIsLoadingTopAlbums] = useState(true);
  const [topTracksError, setTopTracksError] = useState<string | null>(null);
  const [topAlbumsError, setTopAlbumsError] = useState<string | null>(null);
  const [genreDistribution, setGenreDistribution] = useState<GenreData[]>([]);
  const [genreError, setGenreError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string>('Discover insights from your music journey...');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Get first name from full name
  const firstName = session?.user?.name?.split(' ')[0] || '';
  
  // Calculate the date range
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const dateRange = `${format(sevenDaysAgo, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;
  
  const [moodData, setMoodData] = useState<MoodData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    happy: [0, 0, 0, 0, 0, 0, 0],
    calm: [0, 0, 0, 0, 0, 0, 0],
    sad: [0, 0, 0, 0, 0, 0, 0],
    frustrated: [0, 0, 0, 0, 0, 0, 0],
    reflective: [0, 0, 0, 0, 0, 0, 0],
    inspired: [0, 0, 0, 0, 0, 0, 0],
  });

  // Separate function to fetch genre data with retry logic
  const fetchGenreData = async (retryCount = 0) => {
    if (!session) return;
    
    try {
      setIsLoadingGenreData(true);
      setGenreDataError(null);
      
      console.log('Fetching genre distribution data...');
      const response = await fetch('/api/genre-distribution');
      
      if (!response.ok) {
        // Check for specific error codes
        if (response.status === 503 || response.status === 504) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Database connection issue. Please try again later.');
        }
        throw new Error(`Failed to fetch genre data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Genre distribution API response:', {
        status: data.status,
        genreCount: data.genreDistribution?.length || 0,
        correlationCount: data.correlationData?.length || 0
      });
      
      if (data.status === 'empty') {
        // Handle empty data case
        console.log('No genre data available yet:', data.message);
        // Make sure we have at least default correlation data
        if (!data.correlationData || data.correlationData.length === 0) {
          data.correlationData = genreData.correlationData;
        }
        setGenreData({
          genreDistribution: data.genreDistribution || [],
          correlationData: data.correlationData || genreData.correlationData
        });
      } else if (data.error) {
        // Handle error but with fallback data
        console.error('Genre data error with fallback:', data.error);
        setGenreDataError(data.message || 'Unable to load genre distribution data.');
        if (data.fallbackData) {
          // Ensure we have correlation data
          if (!data.fallbackData.correlationData || data.fallbackData.correlationData.length === 0) {
            data.fallbackData.correlationData = genreData.correlationData;
          }
          setGenreData(data.fallbackData);
        }
      } else {
        // Normal success case
        const responseData = {
          genreDistribution: data.genreDistribution || [],
          correlationData: data.correlationData || []
        };
        
        // Ensure we have correlation data
        if (!responseData.correlationData || responseData.correlationData.length === 0) {
          responseData.correlationData = genreData.correlationData;
        }
        
        setGenreData(responseData);
        console.log('Set genre data successfully with correlation data:', responseData.correlationData.length);
      }
    } catch (error) {
      console.error('Error processing genre distribution:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process genre distribution';
      setGenreDataError(errorMessage);
      
      // Implement retry logic for recoverable errors
      if (retryCount < 2) {
        console.log(`Retrying genre data fetch (${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchGenreData(retryCount + 1);
        }, 3000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoadingGenreData(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (session) {
        try {
          setIsLoadingTopTracks(true);
          setIsLoadingTopAlbums(true);
          setTopTracksError(null);
          setTopAlbumsError(null);
          
          const [topTracksData, recentTracksData, journalData, playlistsData] = await Promise.all([
            getTopTracks(session),
            getRecentlyPlayed(session),
            fetch('/api/journal').then(res => res.json()),
            getTopPlaylists(session),
          ]);

          if (topTracksData) {
            setTopTracks(topTracksData);
          } else {
            setTopTracksError('Unable to load top tracks. Please try signing out and back in.');
          }
          
          if (recentTracksData) {
            const processedData = processRecentlyPlayed(recentTracksData);
            setTopAlbums(processedData.topAlbums);
            setTopArtists(processedData.topArtists);
            setCurrentHistory(recentTracksData);
          } else {
            setTopAlbumsError('Unable to load recent tracks. Please try signing out and back in.');
          }
          if (journalData) setJournalEntries(journalData);
          if (playlistsData) setTopPlaylists(playlistsData);
          
          // Fetch genre data separately to handle errors independently
          fetchGenreData();
        } catch (error) {
          console.error('Error fetching data:', error);
          setTopTracksError('Unable to load top tracks. Please try signing out and back in.');
          setTopAlbumsError('Unable to load recent tracks. Please try signing out and back in.');
        } finally {
          setIsLoadingTopTracks(false);
          setIsLoadingTopAlbums(false);
          setIsLoadingMoodData(false);
        }
      }
    }

    async function fetchMoodData() {
      if (session) {
        try {
          setIsLoadingMoodData(true);
          setMoodDataError(null);
          const response = await fetch('/api/mood-analysis');
          if (!response.ok) throw new Error('Failed to fetch mood data');
          const data = await response.json();
          setMoodData(data);
        } catch (error) {
          console.error('Error fetching mood data:', error);
          setMoodDataError('Unable to load mood analysis. Showing data from journal entries only.');
        } finally {
          setIsLoadingMoodData(false);
        }
      }
    }

    // Initial fetch
    fetchData();
    fetchMoodData();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchData, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [session]);

  const processGenreDistribution = async () => {
    if (!currentHistory.length) return;
    
    // Use the same function for regular and manual updates
    fetchGenreData();
  };

  useEffect(() => {
    if (currentHistory?.length > 0) {
      processGenreDistribution();
    }
  }, [currentHistory]);

  // Fetch insight for header
  useEffect(() => {
    async function fetchInsight() {
      if (journalEntries.length > 0 && currentHistory.length > 0) {
        try {
          const response = await fetch('/api/mood-analysis');
          if (response.ok) {
            const moodAnalysis = await response.json();
            // Generate insight from mood analysis
            const headerInsight = await generateHeaderInsight(JSON.stringify(moodAnalysis));
            setInsight(headerInsight);
          }
        } catch (error) {
          console.error('Error fetching insight:', error);
        }
      }
    }
    
    fetchInsight();
  }, [journalEntries, currentHistory]);

  const handleChatOpen = () => {
    setIsChatOpen(true);
    // Scroll to chat component
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Add a refresh function for genre data
  const refreshGenreData = async () => {
    try {
      setIsLoadingGenreData(true);
      setGenreDataError(null);
      
      console.log('Manually refreshing genre distribution data...');
      // Add a force-refresh query parameter to bypass any caching
      const response = await fetch('/api/genre-distribution?forceRefresh=true&t=' + Date.now());
      
      if (!response.ok) {
        throw new Error(`Failed to refresh genre data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Refreshed genre distribution API response:', {
        status: data.status,
        source: data.source,
        genreCount: data.genreDistribution?.length || 0
      });
      
      if (data.status === 'success') {
        setGenreData({
          genreDistribution: data.genreDistribution || [],
          correlationData: data.correlationData || []
        });
        return true;
      } else {
        setGenreDataError(data.message || 'Unable to refresh genre data');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing genre data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh genre data';
      setGenreDataError(errorMessage);
      return false;
    } finally {
      setIsLoadingGenreData(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
        <p className="text-white/70 mt-4">Gathering your Spotify data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <header className="w-full px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/melodi.png"
              alt="Melodi"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </Link>
        </div>
        {session?.user?.image && (
          <ProfileMenu
            userName={session.user.name || ''}
            userImage={session.user.image}
            isWhiteHeader={false}
          />
        )}
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8 relative z-0">
        {/* Insight Header */}
        <InsightHeader insight={insight} onChatOpen={handleChatOpen} />
        
        <div ref={chatRef}>
          <MelodiChat
            userName={session?.user?.name || ''}
            journalEntries={journalEntries}
            listeningHistory={currentHistory}
            dateRange={dateRange}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Your Week in Music
                  <span className="text-sm font-normal text-white/60">{dateRange}</span>
                </h2>
                {isLoadingMoodData ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                    <p className="text-white/70 mt-4">Analyzing your music moods...</p>
                  </div>
                ) : moodDataError ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <p className="text-white/70 mb-4">{moodDataError}</p>
                    <MoodTimeline data={moodData} />
                  </div>
                ) : (
                  <MoodTimeline data={moodData} />
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Your Top Songs</h2>
                {isLoadingTopTracks ? (
                  <div className="h-[200px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                    <p className="text-white/70 mt-4">Fetching your favorite tracks...</p>
                  </div>
                ) : topTracksError ? (
                  <div className="text-white/70 p-4">{topTracksError}</div>
                ) : (
                  <div className="space-y-4">
                    {topTracks.slice(0, 5).map((track, index) => (
                      <div key={track.id} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 relative shrink-0">
                          {track.albumArt ? (
                            <Image
                              src={track.albumArt}
                              alt={track.album}
                              width={48}
                              height={48}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                              <MusicalNoteIcon className="w-6 h-6 text-white/40" />
                            </div>
                          )}
                          <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm font-medium text-white/80">
                            {index + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-white group-hover:text-purple-300 transition-colors">
                            {track.name}
                          </div>
                          <div className="truncate text-white/60 text-sm">
                            {track.artist}
                          </div>
                        </div>
                        {track.playCount && (
                          <div className="text-sm text-white/40">
                            {track.playCount} plays
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Genre Analysis</h2>
                </div>
                {isLoadingGenreData ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                    <p className="text-white/70 mt-4">Discovering your music taste...</p>
                  </div>
                ) : genreDataError ? (
                  <div className="text-white/70 p-4">{genreDataError}</div>
                ) : (
                  <GenreDistribution 
                    genreData={genreData.genreDistribution} 
                    correlationData={genreData.correlationData}
                    isLoading={isLoadingGenreData}
                    error={genreDataError}
                    onRefresh={refreshGenreData}
                  />
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Top Albums This Week</h2>
                {isLoadingTopAlbums ? (
                  <div className="h-[200px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                    <p className="text-white/70 mt-4">Loading your albums...</p>
                  </div>
                ) : topAlbumsError ? (
                  <div className="text-white/70 p-4">{topAlbumsError}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {topAlbums.slice(0, 10).map((album) => (
                      <div key={album.id} className="flex items-center gap-3 group">
                        <div className="w-16 h-16 shrink-0">
                          {album.image ? (
                            <Image
                              src={album.image}
                              alt={album.name}
                              width={64}
                              height={64}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                              <MusicalNoteIcon className="w-8 h-8 text-white/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-white group-hover:text-purple-300 transition-colors">
                            {album.name}
                          </div>
                          <div className="text-sm text-white/60">
                            {album.artist}
                          </div>
                          <div className="text-sm text-white/60">
                            {album.count} {album.count === 1 ? 'play' : 'plays'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 