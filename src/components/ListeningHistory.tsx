'use client';

import { useEffect, useState } from 'react';

export default function ListeningHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/listening-history');
        if (!response.ok) {
          throw new Error('Failed to fetch listening history');
        }
        const data = await response.json();
        setHistory(data.listeningHistory || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading listening history...</div>;
  }

  if (error) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Listening History</h2>
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.slice(0, 5).map((track, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div>
                <p className="font-semibold">{track.trackName}</p>
                <p className="text-sm text-gray-600">{track.artistName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(track.playedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {history.length > 5 && (
            <p className="text-sm text-gray-500">
              Showing 5 of {history.length} tracks
            </p>
          )}
        </div>
      ) : (
        <p>No listening history available</p>
      )}
    </div>
  );
} 