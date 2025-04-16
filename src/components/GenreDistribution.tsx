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
  ChartData,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
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

const GENRE_COLORS = {
  pop: '#FF6B6B',
  rock: '#4ECDC4',
  hiphop: '#45B7D1',
  electronic: '#96CEB4',
  jazz: '#FFEEAD',
  classical: '#D4A5A5',
  indie: '#9B5DE5',
  rnb: '#F15BB5',
  other: '#808080'
};

export default function GenreDistribution({ data, timelineData, correlationData }: GenreDistributionProps) {
  // Add debug logging
  console.log('Genre Distribution Data:', {
    genreData: data,
    timeline: timelineData,
    correlations: correlationData
  });

  const pieData: ChartData<'pie'> = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => item.color),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        padding: 12,
        borderColor: 'rgba(167, 139, 250, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.raw / data.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1);
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
      label: genre.genre,
      data: ['happy', 'calm', 'sad', 'frustrated', 'reflective', 'inspired'].map(mood => {
        const correlation = genre.moods.find(m => m.mood === mood);
        return correlation ? correlation.strength * 100 : 0;
      }),
      backgroundColor: `${GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS]}33`,
      borderColor: GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS],
      borderWidth: 2,
      pointBackgroundColor: GENRE_COLORS[genre.genre as keyof typeof GENRE_COLORS],
    })),
  } : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Genre Distribution</h3>
          <div className="relative h-[300px]">
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
                      max: 100,
                      ticks: {
                        stepSize: 20,
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: {
                          size: 14,
                          weight: '500'
                        },
                        backdropColor: 'rgba(0, 0, 0, 0.2)',
                        backdropPadding: 2,
                        showLabelBackdrop: true
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        lineWidth: 1
                      },
                      angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        lineWidth: 1
                      },
                      pointLabels: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: {
                          size: 14,
                          weight: '500'
                        }
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        boxWidth: 12,
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#1a1a1a',
                      bodyColor: '#1a1a1a',
                      callbacks: {
                        label: function(context: any) {
                          return `${context.dataset.label}: ${context.raw.toFixed(1)}% correlation`;
                        },
                      },
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
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                  y: {
                    stacked: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top' as const,
                    labels: {
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1a1a1a',
                    bodyColor: '#1a1a1a',
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