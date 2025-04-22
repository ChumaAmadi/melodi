'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { MusicalNoteIcon, ExclamationCircleIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subDays, parseISO } from 'date-fns';
import React from 'react';
import 'chart.js/auto';

// Debug log at component import time
console.log('GenreDistribution component loaded');

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

// Mood colors for the radar chart
const MOOD_COLORS = {
  Happy: 'rgba(255, 193, 7, 0.2)',
  Calm: 'rgba(156, 39, 176, 0.2)',
  Sad: 'rgba(33, 150, 243, 0.2)',
  Frustrated: 'rgba(244, 67, 54, 0.2)',
  Reflective: 'rgba(76, 175, 80, 0.2)',
  Inspired: 'rgba(255, 152, 0, 0.2)',
};

const MOOD_BORDER_COLORS = {
  Happy: 'rgba(255, 193, 7, 1)',
  Calm: 'rgba(156, 39, 176, 1)',
  Sad: 'rgba(33, 150, 243, 1)',
  Frustrated: 'rgba(244, 67, 54, 1)',
  Reflective: 'rgba(76, 175, 80, 1)',
  Inspired: 'rgba(255, 152, 0, 1)',
};

interface MoodData {
  Happy: number;
  Calm: number;
  Sad: number;
  Frustrated: number;
  Reflective: number;
  Inspired: number;
}

interface GenreData {
  name: string;
  count: number;
  color: string;
}

interface GenreDistributionProps {
  genreData?: { name: string; count: number; color: string }[];
  correlationData?: { genre: string; moods: { mood: string; strength: number; count: number }[] }[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<boolean>;
  onDataFetched?: (data: any) => void;
}

// Cache structure for mood data to prevent repeated API calls
interface MoodCache {
  [key: string]: {
    timestamp: number;
    data: MoodData;
  }
}

// Add a new interface for genre-specific mood data
interface GenreMoodCache {
  [genre: string]: {
    [dateKey: string]: {
      timestamp: number;
      data: MoodData;
    }
  }
}

// Standalone data fetching function
const fetchGenreData = async (timeRange?: string) => {
  try {
    const params = new URLSearchParams();
    if (timeRange) params.set('timeRange', timeRange);
    
    // Unique timestamp to prevent caching
    params.set('t', Date.now().toString());
    
    console.log(`Fetching genre data with params: ${params.toString()}`);
    const response = await fetch(`/api/genre-distribution?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch genre data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Genre data response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching genre data:', error);
    throw error;
  }
};

// Helper function to capitalize first letter of each word
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export default function GenreDistribution({ 
  genreData = [], 
  correlationData = [],
  isLoading: initialIsLoading = false,
  error = null,
  onRefresh,
  onDataFetched
}: GenreDistributionProps) {
  // Debug log at render time
  console.log('GenreDistribution rendering', { genreData, initialIsLoading, error });

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState<number>(0);
  const chartRef = useRef<any>(null);
  const donutChartRef = useRef<any>(null);
  
  // Client-side rendering check
  const [isClient, setIsClient] = useState(false);
  // Add loading and refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  
  // Direct API data state
  const [directGenreData, setDirectGenreData] = useState<{ name: string; count: number; color: string }[] | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Date picker state
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [dateRange, setDateRange] = useState<string>('');
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  // Add state for genre-specific mood data
  const [genreMoodData, setGenreMoodData] = useState<MoodData | null>(null);
  const [isLoadingMoodData, setIsLoadingMoodData] = useState<boolean>(false);
  
  // Cache for mood data to prevent repeated API calls
  const moodCache = useRef<MoodCache>({});
  // Add cache for genre-specific mood data
  const genreMoodCache = useRef<GenreMoodCache>({});
  // 4 hours cache expiration (in milliseconds)
  const CACHE_EXPIRATION = 4 * 60 * 60 * 1000;
  
  // Debug logging for the props being received
  useEffect(() => {
    console.log('GenreDistribution Props:', {
      genreDataLength: genreData?.length,
      genreData,
      correlationDataLength: correlationData?.length,
    });
  }, [genreData, correlationData]);
  
  // Force chart updates periodically to ensure they render properly
  useEffect(() => {
    const interval = setInterval(() => {
      if (donutChartRef.current) {
        donutChartRef.current.update();
      }
      if (chartRef.current) {
        chartRef.current.update();
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update date range when selected date changes
  useEffect(() => {
    const startDate = subDays(selectedDate, 6);
    setDateRange(`${format(startDate, 'MMM d')} - ${format(selectedDate, 'MMM d, yyyy')}`);
    
    // Fetch mood data for the selected date range
    fetchMoodDataForDateRange(startDate, selectedDate);
  }, [selectedDate]);

  // Add effect to fetch genre-specific mood data when a genre is selected
  useEffect(() => {
    if (selectedGenre) {
      const startDate = subDays(selectedDate, 6);
      fetchGenreMoodData(selectedGenre, startDate, selectedDate);
    } else {
      setGenreMoodData(null);
    }
  }, [selectedGenre, selectedDate]);
    
    // Auto-select the first genre if we have genre data but no selection
  useEffect(() => {
    if (genreData?.length > 0 && !selectedGenre) {
      setSelectedGenre(genreData[0].name);
    }

    // Force a re-render to help with chart initialization
    setRenderKey(prev => prev + 1);
  }, [genreData, selectedGenre]);

  // Initialize mood data with default empty values to prevent errors
  useEffect(() => {
    if (!moodData) {
      // Initialize with zero values instead of null to prevent "no mood data" errors
      const emptyMoodData: MoodData = {
        Happy: 0,
        Calm: 0,
        Sad: 0,
        Frustrated: 0,
        Reflective: 0,
        Inspired: 0
      };
      setMoodData(emptyMoodData);
    }
  }, [moodData]);

  // Function to get a cached result or compute a new one
  const getCachedMoodData = useCallback((cacheKey: string): MoodData | null => {
    const cachedResult = moodCache.current[cacheKey];
    const now = Date.now();
    
    if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRATION) {
      console.log(`Using cached mood data for ${cacheKey}`);
      return cachedResult.data;
    }
    
    return null;
  }, []);

  // Function to save data to cache
  const saveMoodToCache = useCallback((cacheKey: string, data: MoodData) => {
    moodCache.current[cacheKey] = {
      timestamp: Date.now(),
      data
    };
    console.log(`Saved mood data to cache for ${cacheKey}`);
  }, []);

  // Fetch mood data from API with DeepSeek analysis integration
  const fetchMoodDataForDateRange = async (startDate: Date, endDate: Date) => {
    console.log(`Fetching mood data from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    
    try {
      // Generate cache key based on date range
      const cacheKey = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
      
      // Check if we have cached data
      const cachedData = getCachedMoodData(cacheKey);
      if (cachedData) {
        setMoodData(cachedData);
        return;
      }
      
      setIsLoadingMoodData(true);
      setChartError(null);
      
      // Format dates for API request
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // Make API call for mood data with advanced analysis enabled
      const response = await fetch(`/api/mood-analysis?startDate=${startDateStr}&endDate=${endDateStr}&includeDeepSeek=true&includeGenius=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch mood data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Mood data API response:", data);
      
      // Transform data format for radar chart
      if (data && data.hasOwnProperty('happy')) {
        // Create mood data object with real values
        const transformedData: MoodData = {
          Happy: calculateMoodAverage(data.happy) || 0,
          Calm: calculateMoodAverage(data.calm) || 0,
          Sad: calculateMoodAverage(data.sad) || 0,
          Frustrated: calculateMoodAverage(data.frustrated) || 0,
          Reflective: calculateMoodAverage(data.reflective) || 0,
          Inspired: calculateMoodAverage(data.inspired) || 0
        };
        
        // Make sure we have at least one non-zero value
        const hasValues = Object.values(transformedData).some(value => value > 0);
        
        if (hasValues) {
          // Save valid data to cache
          saveMoodToCache(cacheKey, transformedData);
          setMoodData(transformedData);
          setChartError(null);
          console.log("Valid mood data set:", transformedData);
        } else {
          // Handle case where we have data but all values are zero
          setChartError("No significant mood data for this date range");
          // Set empty mood data
          setMoodData(null);
        }
      } else {
        throw new Error("Invalid mood data format received from API");
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
      setChartError('Failed to load mood data for the selected dates');
      setMoodData(null);
    } finally {
      setIsLoadingMoodData(false);
    }
  };

  // Helper function to calculate average mood value from array
  const calculateMoodAverage = (moodArray: number[] | undefined): number => {
    if (!moodArray || moodArray.length === 0) return 0;
    
    // Filter out zero values to avoid skewing averages
    const nonZeroValues = moodArray.filter(val => val > 0);
    if (nonZeroValues.length === 0) return 0;
    
    const sum = nonZeroValues.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / nonZeroValues.length));
  };

  // Add function to fetch genre-specific mood data
  const fetchGenreMoodData = async (genre: string, startDate: Date, endDate: Date) => {
    console.log(`Fetching mood data for genre "${genre}" from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    
    try {
      // Generate cache key based on genre and date range
      const dateKey = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
      
      // Check if we have cached data for this genre and date range
      if (genreMoodCache.current[genre]?.[dateKey] && 
          (Date.now() - genreMoodCache.current[genre][dateKey].timestamp) < CACHE_EXPIRATION) {
        console.log(`Using cached mood data for genre "${genre}" and range ${dateKey}`);
        setGenreMoodData(genreMoodCache.current[genre][dateKey].data);
        return;
      }
      
      setIsLoadingMoodData(true);
      setChartError(null);
      
      // Format dates for API request
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // Make API call for genre-specific mood data with advanced analysis flags
      const response = await fetch(`/api/genre-mood?genre=${encodeURIComponent(genre)}&startDate=${startDateStr}&endDate=${endDateStr}&includeDeepSeek=true&includeGenius=true`);
      
      if (!response.ok) {
        // If genre-specific API endpoint isn't available, use general mood data with genre weighting
        console.log("No genre-specific mood API available, applying genre weighting to general mood data");
        
        if (moodData) {
          // Create genre-weighted mood data by modifying the general mood data based on genre
          const weightedData = applyGenreWeightToMoodData(genre, moodData);
          
          // Save to cache
          if (!genreMoodCache.current[genre]) genreMoodCache.current[genre] = {};
          genreMoodCache.current[genre][dateKey] = {
            timestamp: Date.now(),
            data: weightedData
          };
          
          setGenreMoodData(weightedData);
        } else {
          setGenreMoodData(null);
          setChartError(`No mood data available for ${genre}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log(`Genre-specific mood data for "${genre}":`, data);
      
      if (data && data.moods) {
        const transformedData: MoodData = {
          Happy: data.moods.happy || 0,
          Calm: data.moods.calm || 0,
          Sad: data.moods.sad || 0,
          Frustrated: data.moods.frustrated || 0,
          Reflective: data.moods.reflective || 0,
          Inspired: data.moods.inspired || 0
        };
        
        // Make sure we have at least one non-zero value
        const hasValues = Object.values(transformedData).some(value => value > 0);
        
        if (hasValues) {
          // Save to cache
          if (!genreMoodCache.current[genre]) genreMoodCache.current[genre] = {};
          genreMoodCache.current[genre][dateKey] = {
            timestamp: Date.now(),
            data: transformedData
          };
          
          setGenreMoodData(transformedData);
          setChartError(null);
        } else {
          // Use general mood data with genre weighting if no specific data
          if (moodData) {
            const weightedData = applyGenreWeightToMoodData(genre, moodData);
            setGenreMoodData(weightedData);
          } else {
            setGenreMoodData(null);
            setChartError(`No mood data available for ${genre}`);
          }
        }
      } else {
        throw new Error("Invalid mood data format received from API");
      }
    } catch (error) {
      console.error(`Error fetching mood data for genre "${genre}":`, error);
      
      // Fallback to weighted mood data based on genre
      if (moodData) {
        const weightedData = applyGenreWeightToMoodData(genre, moodData);
        setGenreMoodData(weightedData);
      } else {
        setChartError(`Failed to load mood data for ${genre}`);
        setGenreMoodData(null);
      }
    } finally {
      setIsLoadingMoodData(false);
    }
  };

  // Helper function to apply genre-specific weighting to mood data
  const applyGenreWeightToMoodData = (genre: string, baseMoodData: MoodData): MoodData => {
    // Create a copy of the base mood data
    const weightedData: MoodData = { ...baseMoodData };
    
    // Apply genre-specific adjustments
    const normalizedGenre = genre.toLowerCase();
    
    // Ensure values are at least 10 for visibility
    Object.keys(weightedData).forEach(key => {
      const moodKey = key as keyof MoodData;
      weightedData[moodKey] = Math.max(weightedData[moodKey], 10);
    });
    
    switch (normalizedGenre) {
      case 'r&b':
      case 'rnb':
      case 'soul':
        // R&B tends to be calming and sometimes happy
        weightedData.Calm = Math.min(100, weightedData.Calm * 1.3);
        weightedData.Happy = Math.min(100, weightedData.Happy * 1.2);
        weightedData.Frustrated = Math.max(10, weightedData.Frustrated * 0.7);
        break;
        
      case 'rap':
      case 'hip hop':
      case 'hip-hop':
        // Rap often increases feelings of being inspired
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.4);
        weightedData.Reflective = Math.min(100, weightedData.Reflective * 1.2);
        break;
        
      case 'rock':
        // Rock can be energizing but also sometimes angsty
        // Ensure rock data is always visible
        weightedData.Frustrated = Math.min(100, Math.max(30, weightedData.Frustrated * 1.3));
        weightedData.Inspired = Math.min(100, Math.max(40, weightedData.Inspired * 1.3));
        weightedData.Happy = Math.min(100, Math.max(25, weightedData.Happy * 1.1));
        weightedData.Reflective = Math.min(100, Math.max(35, weightedData.Reflective * 1.2));
        break;
        
      case 'electronic':
      case 'dance':
      case 'edm':
        // Electronic music often elevates happiness
        weightedData.Happy = Math.min(100, weightedData.Happy * 1.4);
        weightedData.Sad = Math.max(10, weightedData.Sad * 0.6);
        // Often energetic and less reflective
        weightedData.Reflective = Math.max(10, weightedData.Reflective * 0.8);
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.2);
        break;
        
      case 'jazz':
        // Jazz is often calming and reflective
        weightedData.Calm = Math.min(100, weightedData.Calm * 1.3);
        weightedData.Reflective = Math.min(100, weightedData.Reflective * 1.3);
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.1);
        break;
        
      case 'classical':
        // Classical music tends to be calming and sometimes sad or reflective
        weightedData.Calm = Math.min(100, weightedData.Calm * 1.4);
        weightedData.Reflective = Math.min(100, weightedData.Reflective * 1.3);
        weightedData.Frustrated = Math.max(10, weightedData.Frustrated * 0.5);
        break;
        
      case 'pop':
        // Pop music is typically upbeat
        weightedData.Happy = Math.min(100, weightedData.Happy * 1.3);
        weightedData.Sad = Math.max(10, weightedData.Sad * 0.8);
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.1);
        break;
        
      case 'metal':
        // Metal can increase both frustration and inspiration
        weightedData.Frustrated = Math.min(100, weightedData.Frustrated * 1.4);
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.2);
        weightedData.Calm = Math.max(10, weightedData.Calm * 0.7);
        break;
        
      case 'country':
        // Country can be reflective and sometimes sad or happy depending on the song
        weightedData.Reflective = Math.min(100, weightedData.Reflective * 1.2);
        weightedData.Happy = Math.min(100, Math.max(30, weightedData.Happy));
        weightedData.Sad = Math.min(100, Math.max(20, weightedData.Sad * 1.1));
        break;
        
      case 'indie':
      case 'alternative':
        // Indie/alternative tends to be reflective and sometimes melancholic
        weightedData.Reflective = Math.min(100, weightedData.Reflective * 1.3);
        weightedData.Sad = Math.min(100, weightedData.Sad * 1.1);
        weightedData.Inspired = Math.min(100, weightedData.Inspired * 1.1);
        break;
    }
    
    // Round all values to integers
    Object.keys(weightedData).forEach(key => {
      weightedData[key as keyof MoodData] = Math.round(weightedData[key as keyof MoodData]);
    });
    
    return weightedData;
  };

  // Create component for the radar chart with ref
  const renderRadarChart = () => {
    if (isLoadingMoodData) {
      return (
        <div className="flex flex-col items-center justify-center h-[80%] rounded-lg bg-purple p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400 mb-3"></div>
          <p className="text-white/70 text-center">Loading mood data...</p>
        </div>
      );
    } 
    
    if (radarData) {
      return (
        <div className="h-full w-full bg-purple-200/20 rounded-lg p-2" style={{background: '#9c61ff20'}}>
          <Radar 
            data={radarData} 
            options={radarOptions} 
            ref={ref => chartRef.current = ref} 
          />
        </div>
      );
    } 
    
    if (chartError) {
      return (
        <div className="flex flex-col items-center justify-center h-full rounded-lg bg-purple-200/20 p-4" style={{background: '#9c61ff20'}}>
          <ExclamationCircleIcon className="h-8 w-8 text-red-400 mb-2" />
          <p className="text-white/70 text-center">{chartError}</p>
        </div>
      );
    } 
    
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-lg bg-purple-200/20 p-4" style={{background: '#9c61ff20'}}>
        <MusicalNoteIcon className="h-8 w-8 text-purple-400 mb-2" />
        <p className="text-white/70 text-center mb-2">
          No mood data available for this date range
        </p>
        <p className="text-white/50 text-sm text-center">
          Add journal entries or listen to music during this period
        </p>
      </div>
    );
  };

  // Prepare radar chart data - updated to use either genre-specific or general mood data
  const prepareRadarData = () => {
    // Use genre-specific mood data if available, otherwise fall back to general mood data
    const dataToUse = selectedGenre && genreMoodData ? genreMoodData : moodData;
    
    if (!dataToUse) {
      console.warn("No mood data available for radar chart");
      return {
        labels: ['Happy', 'Calm', 'Sad', 'Frustrated', 'Reflective', 'Inspired'],
        datasets: [
          {
            label: `Mood Analysis ${selectedGenre ? `for ${selectedGenre}` : ''} (${dateRange})`,
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: '#a855f7aa', // Explicit purple with high opacity
            borderColor: '#a855f7',
            borderWidth: 2,
            pointBackgroundColor: '#a855f7',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#a855f7',
            fill: true
          }
        ]
      };
    }

    try {
      const moodLabels = Object.keys(dataToUse);
      const moodValues = Object.values(dataToUse);

      // Confirm we have non-zero values
      if (!moodValues.length || moodValues.every(val => val === 0)) {
        console.log("All mood values are zero or empty, returning empty chart");
        return {
          labels: ['Happy', 'Calm', 'Sad', 'Frustrated', 'Reflective', 'Inspired'],
          datasets: [
            {
              label: `Mood Analysis ${selectedGenre ? `for ${selectedGenre}` : ''} (${dateRange})`,
              data: [0, 0, 0, 0, 0, 0],
              backgroundColor: '#a855f7aa', // Explicit purple with high opacity
              borderColor: '#a855f7',
              borderWidth: 2,
              pointBackgroundColor: '#a855f7',
              pointBorderColor: '#ffffff',
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#a855f7',
              fill: true
            }
          ]
        };
      }

      // Find the genre color if a genre is selected
      let chartColor = '#a855f7'; // Default purple (hex)
      let chartBgColor = '#a855f7aa'; // Purple with high opacity
      
      if (selectedGenre && hasValidGenreData) {
        const genreItem = finalGenreData.find(g => g.name === selectedGenre);
        if (genreItem) {
          // Use the hex color directly with opacity
          chartColor = genreItem.color;
          // Add alpha to hex color for background
          chartBgColor = genreItem.color + 'aa'; // 'aa' is ~67% opacity in hex
        }
      }

      return {
        labels: moodLabels,
        datasets: [
          {
            label: `Mood Analysis ${selectedGenre ? `for ${selectedGenre}` : ''} (${dateRange})`,
            data: moodValues,
            backgroundColor: chartBgColor,
            borderColor: chartColor,
            borderWidth: 2,
            pointBackgroundColor: chartColor,
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: chartColor,
            fill: true
          }
        ]
      };
    } catch (error) {
      console.error("Error preparing radar data:", error);
      return null;
    }
  };

  // Modified refresh function to optionally fetch directly from API
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        // Use the provided refresh function
        await onRefresh();
      } else {
        // Fetch directly from API
        const data = await fetchGenreData(timeRange === 'week' ? 'week' : 'month');
        setDirectGenreData(data.genreDistribution || []);
        setApiMessage(data.message || null);
        setApiStatus(data.status || null);
        if (onDataFetched) onDataFetched(data);
      }
    } catch (error) {
      console.error("Error refreshing genre data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = async (newRange: 'week' | 'month') => {
    if (newRange === timeRange) return;
    
    setTimeRange(newRange);
    setIsLoading(true);
    
    try {
      const data = await fetchGenreData(newRange);
      setDirectGenreData(data.genreDistribution || []);
      setApiMessage(data.message || null);
      setApiStatus(data.status || null);
      if (onDataFetched) onDataFetched(data);
    } catch (error) {
      console.error(`Error fetching ${newRange} genre data:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Merge prop data with direct API data
  const finalGenreData = directGenreData || genreData;
  const hasValidGenreData = Array.isArray(finalGenreData) && finalGenreData.length > 0;
  
  // Get total plays for percentage calculation
  const totalPlays = hasValidGenreData 
    ? finalGenreData.reduce((sum, g) => sum + g.count, 0)
    : 0;
  
  // Prepare donut chart data
  const prepareDonutData = () => {
    if (!hasValidGenreData) {
      console.log("No valid genre data for chart");
      return {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
      };
    }
    
    return {
      labels: finalGenreData.map(g => capitalizeFirstLetter(g.name)),
      datasets: [
        {
          data: finalGenreData.map(g => g.count),
          backgroundColor: finalGenreData.map(g => g.color),
          borderColor: finalGenreData.map(g => g.color),
          borderWidth: 1,
        },
      ],
    };
  };

  // Function to handle doughnut chart clicks
  const handleDoughnutClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && hasValidGenreData) {
      const clickedGenre = finalGenreData[elements[0].index].name;
      setSelectedGenre(clickedGenre);
    }
  };

  // Create chart data
  const doughnutData = prepareDonutData();
  const radarData = prepareRadarData();
  
  // Update the doughnut options to show correct percentages
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    onClick: handleDoughnutClick,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            if (!hasValidGenreData) return '';
            
            const percentage = totalPlays > 0 ? ((context.raw / totalPlays) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${context.raw} plays (${percentage}%)`;
          },
        },
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        },
        backgroundColor: '#9c61ff',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          display: false, // Hide the numerical values on the chart
          stepSize: 20,
          backdropColor: 'transparent'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.1 // Add slight curve to lines
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#a855f7',
        hoverBackgroundColor: '#ffffff',
      }
    }
  };

  // If explicitly loading, show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mb-4"></div>
        <p className="text-white/70">Analyzing your music tastes...</p>
      </div>
    );
  }

  // For explicit errors from props
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-white/70 text-center mb-2">{error}</p>
        <p className="text-white/50 text-sm text-center">
          We're having trouble analyzing your genre data. Please try again later.
        </p>
      </div>
    );
  }

  // Custom DatePicker style - Fix forwardRef implementation
  const CustomDatePickerInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <button 
        onClick={onClick}
        ref={ref}
        type="button"
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/15 transition-colors"
      >
        <CalendarIcon className="h-4 w-4" />
        <span>{value || "Select date"}</span>
      </button>
    )
  );
  
  CustomDatePickerInput.displayName = 'CustomDatePickerInput';

  const formatMoodTitle = () => {
    return `Mood Analysis ${selectedGenre ? `for ${capitalizeFirstLetter(selectedGenre)}` : ''} ${dateRange}`;
  };

    return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center ml-auto">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1 px-2 py-1.5 bg-white/10 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh genre data from Spotify"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </button>
          <div className="z-10 relative">
            {isClient && (
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => date && setSelectedDate(date)}
                maxDate={today}
                customInput={<CustomDatePickerInput value={format(selectedDate, 'MMM d, yyyy')} />}
                className="react-datepicker-wrapper"
                popperClassName="react-datepicker-popper"
                popperPlacement="bottom-end"
                wrapperClassName="react-datepicker-wrapper"
              />
            )}
        </div>
        </div>
      </div>
      
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" key={renderKey}>
      <div className="aspect-square relative">
          <h4 className="text-md font-medium text-white/80 mb-3">Genre Distribution</h4>
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400 mb-3"></div>
              <p className="text-white/70">Updating your genre data...</p>
            </div>
          ) : hasValidGenreData ? (
            <div className="relative">
              <Doughnut 
                data={doughnutData} 
                options={doughnutOptions} 
                ref={ref => donutChartRef.current = ref}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] rounded-lg bg-black/20 p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400 mb-3"></div>
              <p className="text-white/70">Loading your music data...</p>
            </div>
          )}
      </div>
      <div className="aspect-square">
          <h4 className="text-md font-medium text-white/80 mb-3">{formatMoodTitle()}</h4>
          {renderRadarChart()}
        </div>
      </div>
    </div>
  );
} 