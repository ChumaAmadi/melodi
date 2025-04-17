'use client';

import { useEffect, useState } from 'react';

export default function MoodAnalysis() {
  const [moodData, setMoodData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const response = await fetch('/api/mood-analysis');
        if (!response.ok) {
          throw new Error('Failed to fetch mood data');
        }
        const data = await response.json();
        setMoodData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, []);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading mood analysis...</div>;
  }

  if (error) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Mood Analysis</h2>
      {moodData ? (
        <div>
          {/* Render mood data here */}
          <p>Your mood analysis will appear here</p>
        </div>
      ) : (
        <p>No mood data available</p>
      )}
    </div>
  );
} 