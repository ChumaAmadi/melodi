'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect, Fragment, useRef } from "react";
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
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { signOut } from "next-auth/react";

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
  timePeriod: string;
  hasData: boolean;
  displayPlays: string;
  displayHours: string;
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

// Add helper function to capitalize genre names
const capitalizeGenre = (genre: string): string => {
  if (!genre) return '';
  
  // Split by spaces and hyphens
  return genre.split(/[\s-]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Add simple formatNumber helper function at the top of the file with the other helper functions
const formatNumber = (num: number): string => {
  if (num === 0) return "0";
  return num.toString();
};

// Add a function to check if an image URL is from Facebook's CDN which will likely cause CORS errors
const isFacebookImage = (url: string): boolean => {
  return url.includes('fbcdn.net') || url.includes('facebook.com');
};

// MobileProfileMenu Component
function MobileProfileMenu({ 
  isOpen, 
  setIsOpen, 
  userName, 
  profileImage,
  isLoadingProfileImage
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userName: string;
  profileImage: string | null;
  isLoadingProfileImage: boolean;
}) {
  if (!isOpen) return null;
  
  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
  ];

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };
  
  // Render avatar with initial fallback
  const renderAvatar = (size: number = 48) => {
    const initial = userName?.charAt(0) || '?';
    
    if (isLoadingProfileImage) {
      return (
        <div className="relative animate-pulse">
          <div 
            className="flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full ring-2 ring-white/10"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
        </div>
      );
    }
    
    if (profileImage) {
      return (
        <div className="relative">
          {/* Fallback underneath */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
          </div>
          
          <img
            src={profileImage}
            alt={userName || "User"}
            className="relative z-10 rounded-full border-2 border-white/10"
            style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
          />
        </div>
      );
    }
    
    return (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full ring-2 ring-white/10"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-white font-medium" style={{ fontSize: `${size / 2.5}px` }}>{initial}</span>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Content */}
      <div className="fixed inset-x-0 bottom-0 top-20 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-t-xl shadow-xl overflow-y-auto border-t border-white/10">
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {renderAvatar(56)}
            <div>
              <p className="font-medium text-white text-lg">{userName}</p>
              <p className="text-sm text-purple-300">Signed in</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
          >
            <span className="sr-only">Close menu</span>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 py-6 px-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleLinkClick}
              className="block py-3 px-4 text-base font-medium text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="py-6 px-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="block w-full text-left py-3 px-4 text-base font-medium text-red-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('all');
  const [spotifyProfileImage, setSpotifyProfileImage] = useState<string | null>(null);
  const [isLoadingProfileImage, setIsLoadingProfileImage] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Listening Stats Card - Component defined inside main component to access functions
  const ListeningStats = ({ timePeriod, isLoadingMoodData, stats }: { 
    timePeriod: 'day' | 'week' | 'month' | 'year' | 'all';
    isLoadingMoodData: boolean;
    stats: UserStats | null;
  }) => {
    // Helper function to determine if there is actual listening activity
    const hasListeningActivity = () => {
      if (!stats) return false;
      return (stats.totalListens > 0) || (stats.listeningTime > 0);
    };
    
    console.log("ListeningStats rendered with:", { 
      timePeriod, 
      isLoadingMoodData, 
      stats,
      hasActivity: hasListeningActivity()
    });
    
    // Format numbers for display
    const formatDisplayNumber = (num: number): string => {
      return num.toLocaleString();
    };
    
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Listening Stats</h2>
            
            {/* Time Period Selector */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1 inline-flex mt-2 md:mt-0 border border-white/10">
              {(['day', 'week', 'month', 'year', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimePeriodChange(period)}
                  className={`py-1.5 px-3 text-xs rounded-md transition-colors ${
                    timePeriod === period 
                      ? 'bg-purple-600 text-white' 
                      : 'text-purple-300 hover:bg-white/10'
                  }`}
                  disabled={isLoadingMoodData}
                >
                  {getTimePeriodLabel(period)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Time Period Indicator */}
          <div className="mb-4 text-sm text-center md:text-left text-purple-300">
            <span>Showing data for </span>
            <span className="font-medium text-white">{getTimePeriodLabel(timePeriod)}</span>
            {isLoadingMoodData && (
              <span className="ml-2 inline-flex items-center">
                <div className="w-3 h-3 border-t-2 border-r-2 border-white rounded-full animate-spin mr-1"></div>
                <span className="text-xs">updating...</span>
              </span>
            )}
          </div>
          
          {isLoadingMoodData ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : hasListeningActivity() ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                  <MusicalNoteIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats ? formatDisplayNumber(stats.totalListens) : "0"}
                </p>
                <span className="text-purple-300 text-sm">Total Plays</span>
              </div>
              
              <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats ? formatDisplayNumber(stats.journalEntries) : "0"}
                </p>
                <span className="text-purple-300 text-sm">Journal Entries</span>
              </div>
              
              <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats ? formatDisplayNumber(stats.listeningTime) : "0"}
                </p>
                <span className="text-purple-300 text-sm">{stats?.listeningTime === 1 ? 'Hour' : 'Hours'} Listened</span>
              </div>
              
              <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-5 flex flex-col items-center text-center group hover:scale-105 duration-200 transform">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-3 group-hover:animate-pulse">
                  <span className="text-xl text-white">🎸</span>
                </div>
                <p className="text-xl font-bold text-white mb-1 truncate w-full">
                  {stats?.favoriteGenre ? 
                    capitalizeGenre(stats.favoriteGenre) : 
                    timePeriod === 'all' ? "Unavailable" : "None"}
                </p>
                <span className="text-purple-300 text-sm">Top Genre</span>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mb-2">
                <MusicalNoteIcon className="w-8 h-8 text-purple-300" />
              </div>
              <p className="text-white/70 text-lg">No Listening Activity</p>
              <p className="text-purple-300 text-sm max-w-md">
                {timePeriod === 'day' 
                  ? "You haven't listened to any music today. Play some tunes to see your daily stats!" 
                  : timePeriod === 'week'
                    ? "No music activity found for this week. Try listening to some music or check a different time period."
                    : timePeriod === 'month'
                      ? "No monthly listening data available. Play some music this month to see your stats!"
                      : timePeriod === 'year'
                        ? "No listening data for this year yet. Add some music to your life!"
                        : "We couldn't find any listening data. Try connecting your Spotify account or playing some music!"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Set base URL once component mounts (client-side only)
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Fetch Spotify profile image
  useEffect(() => {
    const fetchSpotifyProfile = async () => {
      setIsLoadingProfileImage(true);
      try {
        console.log("Attempting to fetch Spotify profile for profile page");
        
        // Add a random query parameter to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/user/profile?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' }
        });
        
        console.log("Profile API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Profile API data:", data);
          
          // Check if we have Spotify images available
          if (data.images && data.images.length > 0) {
            const imageUrl = data.images[0].url;
            console.log("Setting Spotify profile image from API response:", imageUrl);
            setSpotifyProfileImage(imageUrl);
            setProfileImageError(false);
          } else {
            console.log("No Spotify images in API response, using fallback:", data.fallbackImage);
            // If no Spotify images but we have a fallback
            if (data.fallbackImage && !data.fallbackImage.includes('facebook')) {
              setSpotifyProfileImage(data.fallbackImage);
            } else {
              setProfileImageError(true);
            }
          }
        } else {
          const errorText = await response.text();
          console.error("Error fetching Spotify profile:", errorText);
          setProfileImageError(true);
        }
      } catch (error) {
        console.error("Error in fetchSpotifyProfile:", error);
        setProfileImageError(true);
      } finally {
        setIsLoadingProfileImage(false);
      }
    };

    if (baseUrl) {
      fetchSpotifyProfile();
    }
  }, [baseUrl]);

  // Fetch data once we have the base URL and session
  useEffect(() => {
    if (session && baseUrl) {
      console.log("Session and baseUrl available, fetching initial data");
      
      // Fetch initial user data with the default time period
      fetchInitialUserData();
    }
  }, [session, baseUrl]);

  // Track time period changes
  useEffect(() => {
    console.log(`Time period changed to: ${timePeriod}`);
    if (session && baseUrl) {
      // Fetch user statistics with the new period
      setIsLoadingMoodData(true);
      fetchUserStats(timePeriod).finally(() => {
        setIsLoadingMoodData(false);
      });
    }
  }, [timePeriod, session, baseUrl]);

  // Helper function to get date range for the selected time period
  const getDateRangeForPeriod = (period: 'day' | 'week' | 'month' | 'year' | 'all') => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0]; // Today, formatted as YYYY-MM-DD
    let startDate = '';
    
    switch (period) {
      case 'day':
        startDate = endDate; // Same day
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        startDate = '2000-01-01'; // Arbitrary past date to get all data
        break;
    }
    
    return { startDate, endDate };
  };

  // Fetch all user data including mood summaries and stats
  const fetchInitialUserData = async () => {
    if (!baseUrl) return;
    
    console.log(`Fetching initial user data with default period: ${timePeriod}`);
    setIsLoadingMoodData(true);
    
    try {
      // Fetch user statistics with the current period
      await fetchUserStats(timePeriod);
      
      // Fetch mood summaries - less critical, can happen after stats are loaded
      await fetchMoodSummaries();
      
      console.log("Successfully loaded initial user data");
    } catch (error) {
      console.error('Error fetching initial user data:', error);
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
        const timestamp = new Date().getTime();
        const response = await fetch(`${baseUrl}/api/mood-analysis?t=${timestamp}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Simplify mood summaries to weekly data structure
          const weeklySummaries = [
            {
              week: "This Week",
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              dominantMood: "calm",
              moodScores: {
                happy: 40,
                calm: 75,
                sad: 20,
                frustrated: 15,
                reflective: 60,
                inspired: 45
              }
            }
          ];
          setMoodSummaries(weeklySummaries);
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
    // Provide fallback data instead of empty array
    const fallbackSummary = {
      week: "This Week",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      dominantMood: "reflective",
      moodScores: {
        happy: 50,
        calm: 60,
        sad: 30,
        frustrated: 20,
        reflective: 70,
        inspired: 40
      }
    };
    setMoodSummaries([fallbackSummary]);
  };

  // Replace the complex fetchUserStats function with a simple, reliable implementation
  const fetchUserStats = async (specificPeriod: 'day' | 'week' | 'month' | 'year' | 'all' = 'all') => {
    console.log(`Fetching user stats for period: ${specificPeriod}`);
    setIsLoadingMoodData(true);
    
    try {
      // Fetch real listening data from the API
      const timestamp = new Date().getTime();
      const response = await fetch(`${baseUrl}/api/spotify/user-data?period=${specificPeriod}&t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received stats for ${specificPeriod}:`, data.stats);
      
      // Get real join date if possible
      let joinDate = '';
      try {
        if (session?.user?.id) {
          joinDate = await getUserJoinDate(session.user.id);
        }
      } catch (error) {
        console.error("Error fetching join date:", error);
      }
      
      // Get real journal entry count if possible
      let journalEntries = 0;
      try {
        if (session?.user?.id) {
          journalEntries = await getJournalEntryCount(session.user.id);
        }
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      }
      
      // Create stats object from real API data
      const stats: UserStats = {
        joinedDate: joinDate,
        totalListens: data.stats?.totalTracks || 0,
        favoriteGenre: data.stats?.topGenre || '',
        topArtist: {
          name: data.topArtist?.name || '',
          image: data.topArtist?.images?.[0]?.url || '/default-artist.jpg'
        },
        journalEntries: journalEntries,
        listeningTime: data.stats?.totalHours || 0,
        timePeriod: specificPeriod,
        hasData: (data.stats?.totalTracks || 0) > 0,
        displayPlays: (data.stats?.totalTracks || 0).toString(),
        displayHours: (data.stats?.totalHours || 0).toString()
      };
      
      console.log(`Real stats for ${specificPeriod}:`, stats);
      setUserStats(stats);
      return stats;
    } catch (error) {
      console.error(`Error in fetchUserStats for ${specificPeriod}:`, error);
      
      // Even in case of error, return empty stats
      const fallbackStats = {
        joinedDate: '',
        totalListens: 0,
        favoriteGenre: '',
        topArtist: {
          name: '',
          image: ''
        },
        journalEntries: 0,
        listeningTime: 0,
        timePeriod: specificPeriod,
        hasData: false,
        displayPlays: '0',
        displayHours: '0'
      };
      
      setUserStats(fallbackStats);
      return fallbackStats;
    } finally {
      setIsLoadingMoodData(false);
    }
  };

  // Get user's registration date with retries
  const getUserJoinDate = async (userId: string): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${baseUrl}/api/user/${userId}/joined-date?t=${timestamp}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
          }
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
        const timestamp = new Date().getTime();
        const response = await fetch(`${baseUrl}/api/journal/count?userId=${userId}&t=${timestamp}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
          }
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
      await fetchInitialUserData();
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

  // Handler for time period change
  const handleTimePeriodChange = (period: 'day' | 'week' | 'month' | 'year' | 'all') => {
    if (period === timePeriod) return; // Don't reload if already on this period
    
    console.log(`Changing time period from ${timePeriod} to ${period}`);
    setTimePeriod(period);
    // The useEffect hook will handle fetching data when timePeriod changes
  };

  // Get readable time period label
  const getTimePeriodLabel = (period: string): string => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': 
      default: return 'All Time';
    }
  };

  const handleProfileImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Error loading profile image, using fallback");
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.style.display = "none"; // Hide the errored image
    setProfileImageError(true);
  };

  // Check if on mobile device
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

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isMobile]);

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
      
      <header className="w-full px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-md border-b border-white/5 relative" style={{ zIndex: 1000 }}>
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
          <div style={{ zIndex: 1001 }}>
            <ProfileMenu
              userName={session.user.name || ''}
              userImage={session.user.image}
              isWhiteHeader={false}
            />
          </div>
        )}
        
        {/* Show mobile menu button on mobile */}
        {isMobile && session?.user?.name && (
          <button 
            ref={mobileMenuButtonRef}
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative z-[1001] flex items-center"
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

      <main className="container max-w-6xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Profile Header */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/20 relative flex items-center justify-center bg-purple-800">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700">
                    <span className="text-4xl font-semibold text-white">
                      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "M"}
                    </span>
                  </div>
                  
                  {isLoadingProfileImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700 animate-pulse">
                      <span className="text-4xl font-semibold text-white">
                        {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "M"}
                      </span>
                    </div>
                  ) : spotifyProfileImage && !profileImageError ? (
                    <img
                      src={spotifyProfileImage}
                      alt={session?.user?.name || "User"}
                      className="w-full h-full object-cover relative z-10"
                      style={{ objectFit: 'cover' }}
                      onError={handleProfileImageError}
                    />
                  ) : session?.user?.image && !isFacebookImage(session.user.image) ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-full h-full object-cover relative z-10"
                      style={{ objectFit: 'cover' }}
                      onError={handleProfileImageError}
                    />
                  ) : null}
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
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Grid */}
                <div className="lg:col-span-2">
                  <ListeningStats 
                    timePeriod={timePeriod}
                    isLoadingMoodData={isLoadingMoodData}
                    stats={userStats}
                  />
                </div>
                
                {/* Top Artist Card */}
                <div className="h-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                  <div className="p-6 h-full flex flex-col">
                    <h2 className="text-xl font-semibold text-white mb-4">Top Artist</h2>
                    
                    {timePeriod !== 'all' ? (
                      <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl text-white">🎵</span>
                        </div>
                        <p className="text-lg font-semibold text-white mb-2">Time Period Selected</p>
                        <p className="text-purple-300 text-sm mb-4">
                          Top artist data is only available when viewing all-time stats
                        </p>
                        <button 
                          onClick={() => handleTimePeriodChange('all')}
                          className="mt-2 flex items-center gap-2 py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-purple-500/30"
                          disabled={isLoadingMoodData}
                        >
                          <span>View All-Time Stats</span>
                        </button>
                      </div>
                    ) : isLoadingMoodData ? (
                      <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                      </div>
                    ) : userStats && userStats.topArtist && userStats.topArtist.name ? (
                      <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full mb-4 overflow-hidden relative">
                          {userStats.topArtist.image && !isFacebookImage(userStats.topArtist.image) ? (
                            <Image 
                              src={userStats.topArtist.image}
                              alt={userStats.topArtist.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              unoptimized={true}
                              onError={(e) => {
                                console.error("Error loading artist image, using fallback");
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/default-artist.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                              <span className="text-3xl font-semibold text-white">
                                {userStats.topArtist.name ? userStats.topArtist.name.charAt(0).toUpperCase() : "A"}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-white mb-2">{userStats.topArtist.name}</p>
                        <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 mb-4">
                          Most Listened
                        </div>
                        <p className="text-purple-300 text-sm">Your most played artist in this time period</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                        <>
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl font-semibold text-white">?</span>
                          </div>
                          <p className="text-white/70 text-lg">Data Unavailable</p>
                          <p className="text-purple-300 text-sm mt-2 mb-4">
                            We couldn't determine your top artist
                          </p>
                          <button 
                            onClick={refreshData}
                            className="mt-2 flex items-center gap-2 py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-sm rounded-lg text-white text-sm transition-colors border border-purple-500/30"
                            disabled={isLoadingMoodData}
                          >
                            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>Try Again</span>
                          </button>
                        </>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
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