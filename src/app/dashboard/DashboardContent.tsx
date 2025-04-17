'use client';

import { useEffect, useState } from 'react';
import { getErrorState, fetchUserData } from '@/lib/spotifyTypes';
import type { Stats, Track } from '@/lib/spotifyTypes';

export function DashboardContent() {
  const [data, setData] = useState<{
    topTracks: Track[] | null;
    recentlyPlayed: Track[] | null;
    stats: Stats | null;
  }>({
    topTracks: null,
    recentlyPlayed: null,
    stats: null
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchUserData();
        setData(result);
      } catch (err) {
        setError('Failed to load your music data. Please try again later.');
        console.error('Error fetching data:', err);
      }
    }

    loadData();
  }, []);

  const errorState = getErrorState();
  const isRateLimited = errorState.isRateLimited;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isRateLimited && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Rate Limited</p>
          <p>You are currently rate limited by Spotify's API. Showing cached data from your previous sessions.</p>
        </div>
      )}

      {data.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total Tracks</h3>
            <p className="text-3xl font-bold">{data.stats.totalTracks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Unique Tracks</h3>
            <p className="text-3xl font-bold">{data.stats.uniqueTracks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Unique Artists</h3>
            <p className="text-3xl font-bold">{data.stats.uniqueArtists}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Unique Albums</h3>
            <p className="text-3xl font-bold">{data.stats.uniqueAlbums}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {data.stats && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Listening Time Distribution</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Morning (6-12)</span>
                  <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(data.stats.timeOfDay.morning / data.stats.totalTracks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{Math.round((data.stats.timeOfDay.morning / data.stats.totalTracks) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Afternoon (12-18)</span>
                  <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${(data.stats.timeOfDay.afternoon / data.stats.totalTracks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{Math.round((data.stats.timeOfDay.afternoon / data.stats.totalTracks) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Evening (18-24)</span>
                  <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${(data.stats.timeOfDay.evening / data.stats.totalTracks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{Math.round((data.stats.timeOfDay.evening / data.stats.totalTracks) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Night (0-6)</span>
                  <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${(data.stats.timeOfDay.night / data.stats.totalTracks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{Math.round((data.stats.timeOfDay.night / data.stats.totalTracks) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Top Genres</h3>
              <div className="space-y-4">
                {Object.entries(data.stats.topGenres)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([genre, count]) => (
                    <div key={genre} className="flex justify-between items-center">
                      <span className="capitalize">{genre}</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-pink-600 h-2.5 rounded-full" 
                          style={{ width: `${(count / data.stats.totalTracks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2">{Math.round((count / data.stats.totalTracks) * 100)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {data.topTracks && data.topTracks.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Your Top Tracks</h2>
            <div className="space-y-4">
              {data.topTracks.map((track, index) => (
                <div key={track.id} className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-500">{index + 1}</span>
                  <div>
                    <p className="font-semibold">{track.name}</p>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                    <p className="text-xs text-gray-500">Played {track.playCount} times</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recentlyPlayed && data.recentlyPlayed.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
            <div className="space-y-4">
              {data.recentlyPlayed.map((track) => (
                <div key={`${track.id}-${track.playedAt}`} className="flex items-center space-x-4">
                  <div>
                    <p className="font-semibold">{track.name}</p>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                    <p className="text-xs text-gray-500">
                      {track.playedAt && new Date(track.playedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!data.topTracks && !data.recentlyPlayed && !data.stats && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">No Data Available</h2>
          <p className="text-gray-600 mt-2">
            We're currently collecting your listening data. Please check back in a few minutes.
          </p>
        </div>
      )}
    </div>
  );
} 