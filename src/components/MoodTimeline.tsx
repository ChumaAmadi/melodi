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
  const chartData: ChartData<'line'> = {
    labels: data.labels,
    datasets: [
      {
        label: 'Nostalgic',
        data: data.nostalgic,
        borderColor: '#B8A5FF',
        backgroundColor: '#B8A5FF',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#B8A5FF',
        pointBorderColor: '#B8A5FF',
        pointBorderWidth: 1,
        fill: false,
      },
      {
        label: 'Calm',
        data: data.calm,
        borderColor: '#4CD9AC',
        backgroundColor: '#4CD9AC',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4CD9AC',
        pointBorderColor: '#4CD9AC',
        pointBorderWidth: 1,
        fill: false,
      },
      {
        label: 'Energetic',
        data: data.energetic,
        borderColor: '#FFB067',
        backgroundColor: '#FFB067',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#FFB067',
        pointBorderColor: '#FFB067',
        pointBorderWidth: 1,
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
          callback: (value: number) => `${value}%`,
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
        borderColor: 'rgba(167, 139, 250, 0.5)',
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
          { label: 'Nostalgic', color: '#B8A5FF' },
          { label: 'Calm', color: '#4CD9AC' },
          { label: 'Energetic', color: '#FFB067' },
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