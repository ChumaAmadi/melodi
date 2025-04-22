'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MoodTimelineProps {
  data: {
    labels: string[];
    happy: number[];
    calm: number[];
    sad: number[];
    frustrated: number[];
    reflective: number[];
    inspired: number[];
  };
}

export default function MoodTimeline({ data }: MoodTimelineProps) {
  // Check if there's any data to display
  const hasData = data.happy?.some(val => val > 0) || 
                 data.calm?.some(val => val > 0) || 
                 data.sad?.some(val => val > 0) ||
                 data.frustrated?.some(val => val > 0) ||
                 data.reflective?.some(val => val > 0) ||
                 data.inspired?.some(val => val > 0);

  if (!hasData) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400 mb-3"></div>
        <p className="text-white/70">Loading your mood data...</p>
      </div>
    );
  }

  // Generate labels for the past 7 days
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i); // Start from 6 days ago
    return format(date, 'EEE, MMM d'); // e.g., "Sun, Apr 13"
  });

  // Mood color definitions
  const moodColors = {
    happy: 'rgba(255, 193, 7, 1)', // Yellow/Gold
    calm: 'rgba(87, 168, 255, 0.85)', // Blue
    sad: 'rgba(33, 150, 243, 0.85)', // Light Blue
    frustrated: 'rgba(244, 67, 54, 0.85)', // Red
    reflective: 'rgba(156, 39, 176, 0.85)', // Purple
    inspired: 'rgba(255, 152, 0, 0.85)', // Orange
  };

  // Create datasets for each mood
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Happy',
        data: data.happy || Array(7).fill(0),
        borderColor: moodColors.happy,
        backgroundColor: moodColors.happy,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.happy,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Calm',
        data: data.calm || Array(7).fill(0),
        borderColor: moodColors.calm,
        backgroundColor: moodColors.calm,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.calm,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Sad',
        data: data.sad || Array(7).fill(0),
        borderColor: moodColors.sad,
        backgroundColor: moodColors.sad,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.sad,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Frustrated',
        data: data.frustrated || Array(7).fill(0),
        borderColor: moodColors.frustrated,
        backgroundColor: moodColors.frustrated,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.frustrated,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Reflective',
        data: data.reflective || Array(7).fill(0),
        borderColor: moodColors.reflective,
        backgroundColor: moodColors.reflective,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.reflective,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Inspired',
        data: data.inspired || Array(7).fill(0),
        borderColor: moodColors.inspired,
        backgroundColor: moodColors.inspired,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: moodColors.inspired,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: true,
          drawOnChartArea: true,
        },
        border: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 8,
          stepSize: 20,
          callback: function(this: any, tickValue: string | number) {
            return `${tickValue}%`;
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: true,
          drawOnChartArea: true,
        },
        border: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 8,
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        padding: 12,
        borderColor: 'rgba(156, 39, 176, 0.5)', // Purple with reduced opacity
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
  };

  return (
    <div className="relative">
      <div className="w-full h-[300px]">
        <Line data={chartData} options={options} />
      </div>
      <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-4">
        {Object.entries(moodColors).map(([mood, color]) => (
          <div key={mood} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm text-white/80 capitalize">{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 