'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";
import { format, isValid } from 'date-fns';
import { 
  UserIcon, 
  CalendarIcon, 
  MusicalNoteIcon, 
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MoodSummary {
  week: string;
  startDate: string;
  endDate: string;
  dominantMood: string;
  moodScores: {
    happy: number;
    calm: number;
    sad: number;
    frustrated: number;
    reflective: number;
    inspired: number;
  };
}

interface UserStats {
  joinedDate: string;
  totalListens: number;
  favoriteGenre: string;
  topArtist: {
    name: string;
    image: string;
  };
  journalEntries: number;
  listeningTime: number;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string, fallback: string = ''): string => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return fallback;
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin");
    },
  });

  const [isLoadingMoodData, setIsLoadingMoodData] = useState(true);
  const [moodSummaries, setMoodSummaries] = useState<MoodSummary[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'mood'
  const [baseUrl, setBaseUrl] = useState('');

  // Set base URL once component mounts (client-side only)
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Fetch mood summaries and user data
  useEffect(() => {
    if (session && baseUrl) {
      fetchUserData();
    }
  }, [session, baseUrl]);

  // Fetch all user data including mood summaries and stats
  const fetchUserData = async () => {
    if (!baseUrl) return;
    
    setIsLoadingMoodData(true);
    
    try {
      // Fetch mood summaries
      await fetchMoodSummaries();
      
      // Fetch user statistics
      await fetchUserStats();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingMoodData(false);
    }
  };

  // Fetch mood summaries with retries
  const fetchMoodSummaries = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(`${baseUrl}/api/mood-summary`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMoodSummaries(data.summaries);
          return; // Success, exit function
        }
      } catch (error) {
        console.error(`Error fetching mood summaries (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // If we get here, all attempts failed
    setMoodSummaries([]); // Empty array instead of mock data
  };

  // Fetch user statistics from Spotify API with retries
  const fetchUserStats = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(`${baseUrl}/api/spotify/user-data`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Get join date safely
          const joinDate = session?.user?.id ? await getUserJoinDate(session.user.id) : '';
          
          // Format the data for our UI with proper validation
          const formattedStats: UserStats = {
            joinedDate: joinDate,
            totalListens: data.stats?.totalTracks || 0,
            favoriteGenre: data.stats?.topGenre || '',
            topArtist: {
              name: data.topTracks?.[0]?.artists?.[0]?.name || '',
              image: data.topTracks?.[0]?.artists?.[0]?.images?.[0]?.url || ''
            },
            journalEntries: await getJournalEntryCount(session?.user?.id || ''),
            listeningTime: data.stats?.totalMinutes ? Math.round(data.stats.totalMinutes / 60) : 0
          };
          
          setUserStats(formattedStats);
          return; // Success, exit function
        }
      } catch (error) {
        console.error(`Error fetching user stats (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // If we get here, all attempts failed
    setUserStats(null); // Null instead of mock data
  };

  // Get user's registration date with retries
  const getUserJoinDate = async (userId: string): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(`${baseUrl}/api/user/${userId}/joined-date`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Validate the date before returning
          if (data.joinedDate && !isNaN(new Date(data.joinedDate).getTime())) {
            return data.joinedDate;
          }
        }
      } catch (error) {
        console.error(`Error fetching join date (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // If we get here, all attempts failed
    return ''; // Empty string instead of mock date
  };

  // Get number of journal entries with retries
  const getJournalEntryCount = async (userId: string): Promise<number> => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(`${baseUrl}/api/journal/count?userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.count;
        }
      } catch (error) {
        console.error(`Error fetching journal count (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // If we get here, all attempts failed
    return 0; // Zero instead of mock count
  };

  const refreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchUserData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'calm': return '😌';
      case 'sad': return '😔';
      case 'frustrated': return '😤';
      case 'reflective': return '🤔';
      case 'inspired': return '✨';
      default: return '📝';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-yellow-500';
      case 'calm': return 'bg-blue-500';
      case 'sad': return 'bg-blue-700';
      case 'frustrated': return 'bg-red-500';
      case 'reflective': return 'bg-purple-500';
      case 'inspired': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-3/4 -left-24 w-72 h-72 bg-blue-600/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-indigo-600/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Floating music notes */}
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
      </div>
      
      <header className="w-full px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-md border-b border-white/5 relative z-10">
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

      <main className="container max-w-6xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Profile Header */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/20 relative">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={144}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-800 flex items-center justify-center text-white">
                      <UserIcon className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                  {session?.user?.name || "Music Enthusiast"}
                </h1>
                <p className="text-purple-300 mb-6">
                  {userStats && userStats.joinedDate ? 
                    `Melodi member since ${safeFormatDate(userStats.joinedDate, 'MMMM yyyy')}` : 
                    'Melodi Member'}
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button 
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-purple-500/30"
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                  </button>
                  <Link href="/journal" className="flex items-center gap-2 py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-blue-500/30">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Journal</span>
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-2 py-2 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-indigo-500/30">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center md:justify-start">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-6 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'stats' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('mood')}
              className={`py-2 px-6 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mood' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Mood Analysis
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Grid */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Your Listening Stats</h2>
                  
                  {userStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                          <MusicalNoteIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                          {userStats.totalListens ? userStats.totalListens.toLocaleString() : "N/A"}
                        </p>
                        <span className="text-purple-300 text-sm">Total Plays</span>
                      </div>
                      
                      <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                          <ChartBarIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                          {userStats.journalEntries || "N/A"}
                        </p>
                        <span className="text-purple-300 text-sm">Journal Entries</span>
                      </div>
                      
                      <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                          <ClockIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                          {userStats.listeningTime || "N/A"}
                        </p>
                        <span className="text-purple-300 text-sm">Hours Listened</span>
                      </div>
                      
                      <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                          <span className="text-xl text-white">🎸</span>
                        </div>
                        <p className="text-xl font-bold text-white mb-1 truncate w-full">
                          {userStats.favoriteGenre || "N/A"}
                        </p>
                        <span className="text-purple-300 text-sm">Top Genre</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center gap-4">
                      {isLoadingMoodData ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                      ) : (
                        <>
                          <p className="text-white/70 text-lg">Data Unavailable</p>
                          <p className="text-purple-300 text-sm max-w-md">
                            We couldn't load your listening statistics. Please check your connection and try again.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Top Artist Card */}
              <div className="h-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 h-full flex flex-col">
                  <h2 className="text-xl font-semibold text-white mb-4">Top Artist</h2>
                  
                  {userStats && userStats.topArtist.name ? (
                    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full mb-4 overflow-hidden relative">
                        {userStats.topArtist.image ? (
                          <Image 
                            src={userStats.topArtist.image}
                            alt={userStats.topArtist.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Handle image loading error
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = '/default-artist.jpg'; // Set default image
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                            <MusicalNoteIcon className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">{userStats.topArtist.name}</p>
                      <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 mb-4">
                        Most Listened
                      </div>
                      <p className="text-purple-300 text-sm">You've been vibing to their music the most over the past month</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                      {isLoadingMoodData ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                      ) : (
                        <>
                          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4">
                            <MusicalNoteIcon className="w-12 h-12 text-white/30" />
                          </div>
                          <p className="text-white/70 text-lg">Data Unavailable</p>
                          <p className="text-purple-300 text-sm mt-2 mb-4">
                            We couldn't determine your top artist
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Mood Tab */}
          {activeTab === 'mood' && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Weekly Mood Insights</h2>
                
                {isLoadingMoodData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                  </div>
                ) : moodSummaries && moodSummaries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {moodSummaries.slice(0, 4).map((summary, index) => (
                      <div 
                        key={index} 
                        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-6 transition-transform hover:scale-[1.02] duration-200 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-white font-medium">{summary.week}</p>
                          <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${getMoodColor(summary.dominantMood)}/30 border border-${getMoodColor(summary.dominantMood).replace('bg-', '')}/30`}>
                            <span className="text-lg">{getMoodEmoji(summary.dominantMood)}</span>
                            <span className="text-white text-xs capitalize font-medium">{summary.dominantMood}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(summary.moodScores).map(([mood, score], i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-white/70 text-xs capitalize">{mood}</span>
                                <span className="text-white/70 text-xs">{Math.round(score)}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getMoodColor(mood)}`} 
                                  style={{ width: `${Math.round(score)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-2">
                      <span className="text-3xl text-white/30">📊</span>
                    </div>
                    <p className="text-white/70 text-lg">Mood Data Unavailable</p>
                    <p className="text-purple-300 text-sm max-w-lg">
                      We couldn't load your mood analysis data. This could be because you don't have enough journal entries or listening history yet.
                    </p>
                    <Link 
                      href="/journal" 
                      className="mt-4 flex items-center gap-2 py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-purple-500/30"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span>Start Journaling</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
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
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 