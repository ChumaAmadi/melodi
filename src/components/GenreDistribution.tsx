'use client';

import { Pie, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartData,
} from 'chart.js';
import { GENRE_COLORS, CHART_THEME } from '@/lib/constants/colors';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface GenreData {
  name: string;
  count: number;
  color: string;
}

interface MoodCorrelation {
  mood: string;
  strength: number;
  count: number;
}

interface GenreCorrelation {
  genre: string;
  moods: MoodCorrelation[];
}

interface GenreDistributionProps {
  data: GenreData[];
  timelineData?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
  correlationData?: GenreCorrelation[];
}

export default function GenreDistribution({ data = [], timelineData, correlationData }: GenreDistributionProps) {
  // Add debug logging
  console.log('Genre Distribution Data:', {
    genreData: data,
    timeline: timelineData,
    correlations: correlationData
  });

  // Return early if no data
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-white/70 text-center">No genre data available for this week.</p>
      </div>
    );
  }

  const pieData: ChartData<'pie'> = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => {
          const normalizedGenre = item.name.toLowerCase().trim();
          return GENRE_COLORS[normalizedGenre as keyof typeof GENRE_COLORS] || GENRE_COLORS.other;
        }),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          color: CHART_THEME.text.primary,
          font: {
            size: 13,
            weight: 700
          },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: CHART_THEME.tooltip.background,
        titleColor: CHART_THEME.tooltip.text,
        bodyColor: CHART_THEME.tooltip.text,
        padding: 12,
        borderColor: CHART_THEME.tooltip.border,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const total = data.reduce((sum, item) => sum + item.count, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${percentage}% (${context.raw} plays)`;
          },
        },
      },
    },
  };

  // Prepare mood correlation data for radar chart
  const moodCorrelationData = correlationData ? {
    labels: ['Happy', 'Calm', 'Sad', 'Frustrated', 'Reflective', 'Inspired'],
    datasets: correlationData.map(genre => ({
      label: genre.genre.charAt(0).toUpperCase() + genre.genre.slice(1),
      data: ['happy', 'calm', 'sad', 'frustrated', 'reflective', 'inspired'].map(mood => {
        const correlation = genre.moods.find(m => m.mood === mood);
        // Ensure the value is between 0 and 1
        return correlation ? Math.min(Math.max(correlation.strength, 0), 1) : 0;
      }),
      backgroundColor: 'transparent', // Make fill transparent
      borderColor: GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS],
      borderWidth: 2,
      pointBackgroundColor: GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS],
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS],
      pointRadius: 3,
      fill: true,
    })),
  } : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Genre Distribution</h3>
          <div className="relative h-[300px] bg-white/5 rounded-lg p-4">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
        
        {correlationData && moodCorrelationData && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Genre-Mood Correlation</h3>
            <div className="relative h-[300px] bg-white/5 rounded-lg p-4">
              <Radar
                data={moodCorrelationData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      min: 0,
                      max: 1,
                      grid: {
                        color: CHART_THEME.grid.color,
                        lineWidth: 1
                      },
                      ticks: {
                        display: false,
                        stepSize: 0.2,
                      },
                      angleLines: {
                        color: CHART_THEME.grid.color,
                        lineWidth: 1
                      },
                      pointLabels: {
                        color: CHART_THEME.text.primary,
                        font: {
                          size: 14,
                          weight: 700
                        }
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        color: CHART_THEME.text.secondary,
                        boxWidth: 12,
                        padding: 15,
                        font: {
                          size: 12,
                          weight: 700
                        }
                      },
                    },
                    tooltip: {
                      enabled: false
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {timelineData && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Genre Timeline</h3>
          <div className="relative h-[300px]">
            <Bar
              data={timelineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    stacked: true,
                    grid: {
                      color: CHART_THEME.grid.color,
                    },
                    ticks: {
                      color: CHART_THEME.text.secondary,
                    },
                  },
                  y: {
                    stacked: true,
                    max: 100,
                    grid: {
                      color: CHART_THEME.grid.color,
                    },
                    ticks: {
                      color: CHART_THEME.text.secondary,
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top' as const,
                    labels: {
                      color: CHART_THEME.text.secondary,
                    },
                  },
                  tooltip: {
                    backgroundColor: CHART_THEME.tooltip.background,
                    titleColor: CHART_THEME.tooltip.text,
                    bodyColor: CHART_THEME.tooltip.text,
                    callbacks: {
                      label: function(context: any) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                      }
                    }
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 