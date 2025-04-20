'use client';

import { useEffect, useState, useRef } from 'react';
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
import { MusicalNoteIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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

// Default genres for empty state
const DEFAULT_GENRES = [
  { name: 'pop', count: 1, color: 'rgba(255, 92, 168, 0.85)' },
  { name: 'rock', count: 1, color: 'rgba(164, 182, 255, 0.85)' },
  { name: 'electronic', count: 1, color: 'rgba(46, 254, 200, 0.85)' }
];

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
}

export default function GenreDistribution({ 
  genreData = [], 
  correlationData = [],
  isLoading = false,
  error = null
}: GenreDistributionProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [renderKey, setRenderKey] = useState<number>(0);
  const chartRef = useRef<any>(null);

  // Add debug button to force fallback
  useEffect(() => {
    console.log('GenreDistribution mounted or updated');
    return () => console.log('GenreDistribution unmounted');
  }, []);

  // Log data for debugging
  useEffect(() => {
    console.log('GenreDistribution render:', { 
      genreDataLength: genreData?.length || 0,
      correlationDataLength: correlationData?.length || 0,
      selectedGenre,
      fallbackMode
    });
    
    // Auto-select the first genre if we have genre data but no selection
    if (genreData?.length > 0 && !selectedGenre && correlationData?.length > 0) {
      setSelectedGenre(genreData[0].name);
      console.log('Auto-selecting first genre:', genreData[0].name);
    }

    // Force a re-render to help with chart initialization
    setRenderKey(prev => prev + 1);
  }, [genreData, correlationData, selectedGenre, fallbackMode]);

  // Clear selection when data changes
  useEffect(() => {
    if (genreData?.length > 0) {
      setSelectedGenre(genreData[0].name);
      console.log('Setting initial genre selection to:', genreData[0].name);
    } else {
      setSelectedGenre(null);
    }
  }, [genreData]);

  // Validate data and set fallbacks
  const validGenreData = genreData && genreData.length > 0 
    ? genreData 
    : DEFAULT_GENRES;

  const prepareRadarData = (genreName: string | null) => {
    if (!genreName || !correlationData || correlationData.length === 0) {
      console.warn("No genre selected or no correlation data");
      return null;
    }

    try {
      // Find the correlation data for the selected genre
      const genreCorrelation = correlationData.find(item => 
        item.genre.toLowerCase() === genreName.toLowerCase());
      
      // If no exact match, try to find a partial match
      let correlations = genreCorrelation?.moods;
      
      if (!correlations) {
        // Try to find partial matches (e.g. "rock" matching "indie rock")
        const partialMatch = correlationData.find(item => 
          item.genre.toLowerCase().includes(genreName.toLowerCase()) || 
          genreName.toLowerCase().includes(item.genre.toLowerCase())
        );
        
        if (partialMatch) {
          correlations = partialMatch.moods;
          console.log(`Using partial match: ${partialMatch.genre} for ${genreName}`);
        } else {
          console.error(`No correlation data found for genre: ${genreName}`);
          setChartError(`No mood data available for ${genreName}`);
          return null;
        }
      }
      
      if (!correlations) {
        console.error("Correlation data structure is invalid");
        setChartError("Mood data is in an invalid format");
        return null;
      }

      // Ensure we have all required moods with default 0 values
      const moodLabels = ['Happy', 'Calm', 'Sad', 'Frustrated', 'Reflective', 'Inspired'];
      const moodValues = moodLabels.map(mood => {
        // Check if correlations exists and has expected structure
        if (correlations && Array.isArray(correlations)) {
          const foundMood = correlations.find(item => item.mood.toLowerCase() === mood.toLowerCase());
          return foundMood ? Math.round(foundMood.strength * 100) : 0;
        }
        return 0;
      });

      return {
        labels: moodLabels,
        datasets: [
          {
            label: `${genreName} Mood Correlation`,
            data: moodValues,
            backgroundColor: 'rgba(138, 43, 226, 0.2)',
            borderColor: 'rgba(138, 43, 226, 1)',
            borderWidth: 1,
            pointBackgroundColor: 'rgba(138, 43, 226, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(138, 43, 226, 1)'
          }
        ]
      };
    } catch (error) {
      console.error("Error preparing radar data:", error);
      setChartError("Error preparing mood data");
      return null;
    }
  };

  const doughnutData = {
    labels: validGenreData.map((g) => g.name),
    datasets: [
      {
        data: validGenreData.map((g) => g.count),
        backgroundColor: validGenreData.map((g) => g.color),
        borderColor: validGenreData.map((g) => g.color),
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
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
            const total = validGenreData.reduce((sum, g) => sum + g.count, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${context.raw} plays (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const clickedGenre = validGenreData[elements[0].index].name;
        console.log(`Selected genre: ${clickedGenre}`);
        setSelectedGenre(clickedGenre);
      }
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.formattedValue}`;
          }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: 'rgba(255, 255, 255, 0.5)',
          backdropColor: 'transparent'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      }
    }
  };

  // Create a simple fallback chart data
  const fallbackDoughnutData = {
    labels: ['Category A', 'Category B', 'Category C'],
    datasets: [{
      data: [30, 50, 20],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const fallbackRadarData = {
    labels: ['A', 'B', 'C', 'D', 'E', 'F'],
    datasets: [{
      label: 'Dataset 1',
      data: [65, 59, 90, 81, 56, 55],
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }]
  };

  const radarData = prepareRadarData(selectedGenre);
  console.log('Final radar data:', radarData);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mb-4"></div>
        <p className="text-white/70">Analyzing your music tastes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-white/70 text-center mb-2">{error}</p>
        <p className="text-white/50 text-sm text-center">
          We're having trouble analyzing your genre data. Please try again later.
        </p>
        <button 
          onClick={() => setFallbackMode(!fallbackMode)} 
          className="mt-4 px-4 py-2 bg-purple-700 text-white rounded"
        >
          Show Test Chart
        </button>
      </div>
    );
  }

  if (fallbackMode) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" key={`fallback-${renderKey}`}>
        <div className="aspect-square relative">
          <Doughnut 
            data={fallbackDoughnutData} 
            options={{ responsive: true, maintainAspectRatio: true }} 
          />
        </div>
        <div className="aspect-square">
          <Radar 
            data={fallbackRadarData} 
            options={{ responsive: true, maintainAspectRatio: true }} 
          />
        </div>
      </div>
    );
  }

  if (validGenreData.length === 0 || validGenreData.every(g => g.count === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <MusicalNoteIcon className="h-12 w-12 text-purple-400 mb-4" />
        <p className="text-white/70 text-center mb-2">No genre data available yet</p>
        <p className="text-white/50 text-sm text-center">
          Play some music or create journal entries to see your genre analysis.
        </p>
        <button 
          onClick={() => setFallbackMode(!fallbackMode)} 
          className="mt-4 px-4 py-2 bg-purple-700 text-white rounded"
        >
          Show Test Chart
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" key={renderKey}>
      <div className="aspect-square relative">
        <Doughnut 
          data={doughnutData} 
          options={doughnutOptions} 
          ref={ref => chartRef.current = ref}
        />
        {!genreData?.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg backdrop-blur-sm">
            <div className="text-center p-4">
              <p className="text-white/70 mb-2">Sample data shown</p>
              <p className="text-white/50 text-sm">
                Listen to music to see your actual genre distribution
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="aspect-square">
        {radarData ? (
          <div className="h-full w-full">
            <Radar data={radarData} options={radarOptions} />
          </div>
        ) : chartError ? (
          <div className="flex flex-col items-center justify-center h-full rounded-lg bg-black/20 p-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-white/70 text-center">{chartError}</p>
            <button 
              onClick={() => setFallbackMode(true)} 
              className="mt-2 px-2 py-1 bg-purple-700/50 text-white/80 text-sm rounded"
            >
              Show Test Chart
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-lg bg-black/20 p-4">
            <p className="text-white/70 text-center mb-2">
              {selectedGenre ? 
                'No mood data available for this genre' :
                'Select a genre to view mood correlations'
              }
            </p>
            <p className="text-white/50 text-sm text-center">
              {selectedGenre ? 
                'Try adding more journal entries after listening to this genre' :
                'Click on a genre in the chart to see how it correlates with your moods'
              }
            </p>
            <button 
              onClick={() => setFallbackMode(true)} 
              className="mt-4 px-2 py-1 bg-purple-700/50 text-white/80 text-sm rounded"
            >
              Show Test Chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 