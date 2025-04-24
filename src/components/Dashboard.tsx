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
import MobileProfileMenu from './MobileProfileMenu';
import InsightHeader from './InsightHeader';
import { TopPlaylist } from '@/lib/spotify';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Doughnut } from "react-chartjs-2";
import { generateHeaderInsight } from "@/lib/deepseek";
import useSpotifyProfile from "@/hooks/useSpotifyProfile";
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
    genreDistribution: [],
    correlationData: []
  });
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(true);
  const [moodDataError, setMoodDataError] = useState<string | null>(null);
  const [isLoadingGenreData, setIsLoadingGenreData] = useState(true);
  const [genreDataError, setGenreDataError] = useState<string | null>(null);
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true);
  const [isLoadingTopAlbums, setIsLoadingTopAlbums] = useState(true);
  const [topTracksError, setTopTracksError] = useState<string | null>(null);
  const [topAlbumsError, setTopAlbumsError] = useState<string | null>(null);
  const [genreDistribution, setGenreDistribution] = useState<GenreData[]>([]);
  const [genreError, setGenreError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string>('Discover insights from your music journey...');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use the Spotify profile hook
  const { 
    spotifyProfileImage, 
    isLoadingProfileImage, 
    profileImageError 
  } = useSpotifyProfile();
  
  // Get first name from full name
  const firstName = session?.user?.name?.split(' ')[0] || '';
  
  // Calculate the date range
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const dateRange = `${format(sevenDaysAgo, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;
  
  // Define moodData state with empty arrays
  const [moodData, setMoodData] = useState<MoodData>({
    labels: [],
    happy: [],
    calm: [],
    sad: [],
    frustrated: [],
    reflective: [],
    inspired: [],
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

  // Implement mobile check
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
        <p className="text-white/70 mt-4">Gathering your Spotify data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 relative overflow-hidden">
      {/* Dynamic animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {/* Animated waveform pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path 
              fill="rgba(255,255,255,0.3)" 
              fillOpacity="1" 
              className="animate-wave-slow" 
              style={{animationDuration: '7s'}}
              d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,74.7C672,75,768,117,864,144C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            </path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full absolute bottom-0">
            <path 
              fill="rgba(255,255,255,0.2)" 
              fillOpacity="1" 
              className="animate-wave-slow" 
              style={{animationDuration: '15s', animationDirection: 'reverse'}}
              d="M0,160L40,160C80,160,160,160,240,144C320,128,400,96,480,112C560,128,640,192,720,192C800,192,880,128,960,112C1040,96,1120,128,1200,138.7C1280,149,1360,139,1400,133.3L1440,128L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z">
            </path>
          </svg>
        </div>

        {/* Spectrum analyzer */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-end h-20 gap-[3px] opacity-20">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="w-[5px] bg-gradient-to-t from-blue-400 via-purple-500 to-pink-500 rounded-t-lg"
              style={{
                height: `${Math.abs(Math.sin((i + 1) * 0.3)) * 100}%`,
                animation: `spectrum ${1.5 + Math.random() * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`
              }}
            ></div>
          ))}
        </div>

        {/* Animated abstract music visualizer */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
            <div className="absolute w-full h-full rounded-full border-2 border-blue-400/30 animate-pulse-slow"></div>
            <div className="absolute w-full h-full rounded-full border-2 border-purple-400/30 animate-pulse-slow" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute w-full h-full rounded-full border-2 border-pink-400/30 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
            <div className="absolute w-full h-full rounded-full border-2 border-indigo-400/30 animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
            
            {/* Intersecting circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-white/10 animate-spin-slow" style={{animationDuration: '20s'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-white/10 animate-spin-slow" style={{animationDuration: '25s', transformOrigin: 'center', transform: 'rotate(45deg)'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-white/10 animate-spin-slow" style={{animationDuration: '30s', transformOrigin: 'center', transform: 'rotate(90deg)'}}></div>
          </div>
        </div>

        {/* Flying music notes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => {
            const symbols = ['♩', '♪', '♫', '♬', '♭', '♮', '♯'];
            const sizes = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const size = sizes[Math.floor(Math.random() * sizes.length)];
            
            return (
              <div 
                key={i}
                className={`absolute text-white/10 ${size} animate-float-note`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${15 + Math.random() * 20}s`,
                  animationDelay: `${Math.random() * 10}s`
                }}
              >
                {symbol}
              </div>
            );
          })}
        </div>

        {/* Stylized vinyl record */}
        <div className="absolute bottom-10 right-10 w-60 h-60 opacity-10">
          <div className="relative w-full h-full animate-spin-very-slow">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-black"></div>
            <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-br from-gray-600 to-gray-800"></div>
            </div>
            {/* Vinyl grooves */}
            <div className="absolute inset-[10%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[20%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[30%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[40%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[50%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[60%] rounded-full border border-white/5"></div>
            <div className="absolute inset-[70%] rounded-full border border-white/5"></div>
          </div>
        </div>
      </div>
      
      <header className="w-full px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-sm border-b border-white/5 relative z-[2000] transform-gpu" style={{ transform: 'translateZ(0)' }}>
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
        
        {/* Only show the ProfileMenu on desktop */}
        {!isMobile && session?.user?.image && (
          <ProfileMenu
            userName={session.user.name || ''}
            userImage={session.user.image}
            isWhiteHeader={false}
          />
        )}
        
        {/* Show mobile menu button on mobile */}
        {isMobile && session?.user?.name && (
          <button 
            ref={mobileMenuButtonRef}
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative z-[2001] flex items-center"
          >
            {isLoadingProfileImage ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 animate-pulse flex items-center justify-center">
                <span className="text-white font-medium">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : spotifyProfileImage ? (
              <img
                src={spotifyProfileImage}
                alt={session.user.name}
                className="w-10 h-10 rounded-full border-2 border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>
        )}
      </header>

      {/* Mobile Profile Menu */}
      {isMobile && (
        <MobileProfileMenu
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          userName={session?.user?.name || ''}
          profileImage={spotifyProfileImage}
          isLoadingProfileImage={isLoadingProfileImage}
        />
      )}

      <main className="container mx-auto px-6 py-8 space-y-8 relative z-10">
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
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
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
      
      {/* Custom animation keyframes */}
      <style jsx global>{`
        @keyframes wave-slow {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-5%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        @keyframes spectrum {
          0% {
            height: 10%;
          }
          50% {
            height: var(--random-height, 70%);
          }
          100% {
            height: 30%;
          }
        }
        
        @keyframes float-note {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.05;
          }
          25% {
            transform: translate(50px, -30px) rotate(20deg);
            opacity: 0.1;
          }
          50% {
            transform: translate(100px, -60px) rotate(40deg);
            opacity: 0.05;
          }
          75% {
            transform: translate(150px, -30px) rotate(20deg);
            opacity: 0.1;
          }
          100% {
            transform: translate(200px, 0) rotate(0deg);
            opacity: 0;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin 40s linear infinite;
        }
        
        .animate-wave-slow {
          animation: wave-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 