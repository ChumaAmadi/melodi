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
    nostalgic: number[];
    calm: number[];
    energetic: number[];
  };
}

export default function MoodTimeline({ data }: MoodTimelineProps) {
  // Check if there's any data to display
  const hasData = data.nostalgic.some(val => val > 0) || 
                 data.calm.some(val => val > 0) || 
                 data.energetic.some(val => val > 0);

  if (!hasData) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-white/70">No mood data available. Add journal entries to see your mood timeline.</p>
      </div>
    );
  }

  // Generate labels for the past 7 days
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i); // Start from 6 days ago
    return format(date, 'EEE, MMM d'); // e.g., "Sun, Apr 13"
  });

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Nostalgic',
        data: data.nostalgic,
        borderColor: 'rgba(255, 92, 168, 0.85)', // Electric Rose
        backgroundColor: 'rgba(255, 92, 168, 0.85)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(255, 92, 168, 0.85)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Calm',
        data: data.calm,
        borderColor: 'rgba(87, 168, 255, 0.85)', // Dream Blue
        backgroundColor: 'rgba(87, 168, 255, 0.85)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(87, 168, 255, 0.85)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Energetic',
        data: data.energetic,
        borderColor: 'rgba(255, 158, 87, 0.85)', // Peach Neon
        backgroundColor: 'rgba(255, 158, 87, 0.85)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(255, 158, 87, 0.85)',
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
        borderColor: 'rgba(255, 92, 168, 0.5)', // Electric Rose with reduced opacity
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
      <div className="flex justify-center gap-6 mt-4">
        {[
          { label: 'Nostalgic', color: 'rgba(255, 92, 168, 0.85)' }, // Electric Rose
          { label: 'Calm', color: 'rgba(87, 168, 255, 0.85)' }, // Dream Blue
          { label: 'Energetic', color: 'rgba(255, 158, 87, 0.85)' }, // Peach Neon
        ].map((mood) => (
          <div key={mood.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }} />
            <span className="text-sm text-white/80">{mood.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 