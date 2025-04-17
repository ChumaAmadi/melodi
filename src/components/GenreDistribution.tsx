'use client';

import { useEffect, useState } from 'react';

interface GenreData {
  name: string;
  count: number;
  color?: string;
}

interface GenreDistributionProps {
  data?: GenreData[];
  timelineData?: any;
  correlationData?: any;
}

export default function GenreDistribution({ data = [], timelineData, correlationData }: GenreDistributionProps) {
  const [genres, setGenres] = useState<GenreData[]>(data);
  const [loading, setLoading] = useState(!data.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      setGenres(data);
      setLoading(false);
      return;
    }

    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genre-distribution');
        if (!response.ok) {
          throw new Error('Failed to fetch genre distribution');
        }
        const data = await response.json();
        setGenres(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [data]);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading genre distribution...</div>;
  }

  if (error) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Genre Distribution</h2>
      {genres.length > 0 ? (
        <div className="space-y-4">
          {genres.map((genre) => (
            <div key={genre.name} className="flex items-center justify-between">
              <span className="font-medium">{genre.name}</span>
              <span className="text-gray-600">{genre.count} tracks</span>
            </div>
          ))}
        </div>
      ) : (
        <p>No genre data available</p>
      )}
    </div>
  );
} 