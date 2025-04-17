'use client';

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTopTracks, getRecentlyPlayed, processRecentlyPlayed, getTopPlaylists } from "@/lib/spotify";
import MoodTimeline from "./MoodTimeline";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import MelodiChat from './MelodiChat';
import GenreDistribution from './GenreDistribution';
import ProfileMenu from './ProfileMenu';
import { TopPlaylist } from '@/lib/spotify';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  playCount?: number;
  playedAt?: string;
}

interface TopItem {
  id: string;
  name: string;
  image?: string;
  count: number;
  artist?: string;
}

interface MoodData {
  labels: string[];
  nostalgic: number[];
  calm: number[];
  energetic: number[];
}

interface GenreData {
  name: string;
  count: number;
  color: string;
}

const REFRESH_INTERVAL = 30000; // Refresh every 30 seconds

export default function Dashboard() {
  const { data: session } = useSession();
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topAlbums, setTopAlbums] = useState<TopItem[]>([]);
  const [topArtists, setTopArtists] = useState<TopItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [listeningHistory, setListeningHistory] = useState<any[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<TopPlaylist[]>([]);
  const [genreData, setGenreData] = useState<{ genreDistribution: GenreData[], timelineData: any, correlationData: any }>({
    genreDistribution: [],
    timelineData: null,
    correlationData: null
  });
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(true);
  const [moodDataError, setMoodDataError] = useState<string | null>(null);
  const [isLoadingGenreData, setIsLoadingGenreData] = useState(true);
  const [genreDataError, setGenreDataError] = useState<string | null>(null);
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true);
  const [topTracksError, setTopTracksError] = useState<string | null>(null);
  
  // Get first name from full name
  const firstName = session?.user?.name?.split(' ')[0] || '';
  
  // Calculate the date range
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const dateRange = `${format(sevenDaysAgo, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;
  
  const [moodData, setMoodData] = useState<MoodData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    nostalgic: [0, 0, 0, 0, 0, 0, 0],
    calm: [0, 0, 0, 0, 0, 0, 0],
    energetic: [0, 0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    async function fetchData() {
      if (session) {
        try {
          setIsLoadingTopTracks(true);
          setTopTracksError(null);
          
          const [topTracksData, recentTracksData, journalData, genreDistData, playlistsData] = await Promise.all([
            getTopTracks(session),
            getRecentlyPlayed(session),
            fetch('/api/journal').then(res => res.json()),
            fetch('/api/genre-distribution').then(res => res.json()),
            getTopPlaylists(session),
          ]);

          if (topTracksData) {
            setTopTracks(topTracksData);
          } else {
            setTopTracksError('Unable to load top tracks. Please try signing out and back in.');
          }
          
          if (recentTracksData) {
            const processedData = processRecentlyPlayed(recentTracksData);
            setTopAlbums(processedData.topAlbums);
            setTopArtists(processedData.topArtists);
            setListeningHistory(recentTracksData);
          }
          if (journalData) setJournalEntries(journalData);
          if (genreDistData) setGenreData(genreDistData);
          if (playlistsData) setTopPlaylists(playlistsData);
        } catch (error) {
          console.error('Error fetching data:', error);
          setGenreDataError('Unable to load genre distribution data.');
          setTopTracksError('Unable to load top tracks. Please try signing out and back in.');
        } finally {
          setIsLoadingTopTracks(false);
          setIsLoadingMoodData(false);
          setIsLoadingGenreData(false);
        }
      }
    }

    async function fetchMoodData() {
      if (session) {
        try {
          setIsLoadingMoodData(true);
          setMoodDataError(null);
          const response = await fetch('/api/mood-analysis');
          if (!response.ok) throw new Error('Failed to fetch mood data');
          const data = await response.json();
          setMoodData(data);
        } catch (error) {
          console.error('Error fetching mood data:', error);
          setMoodDataError('Unable to load mood analysis. Showing data from journal entries only.');
        } finally {
          setIsLoadingMoodData(false);
        }
      }
    }

    // Initial fetch
    fetchData();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchData, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <header className="w-full px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/melodi.png"
              alt="Melodi"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </Link>
        </div>
        {session?.user?.image && (
          <ProfileMenu
            userName={session.user.name || ''}
            userImage={session.user.image}
          />
        )}
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8 relative z-0">
        <MelodiChat
          userName={session?.user?.name || ''}
          journalEntries={journalEntries}
          listeningHistory={listeningHistory}
          dateRange={dateRange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Your Week in Music
                  <span className="text-sm font-normal text-white/60">{dateRange}</span>
                </h2>
                {isLoadingMoodData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                  </div>
                ) : moodDataError ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <p className="text-white/70 mb-4">{moodDataError}</p>
                    <MoodTimeline data={moodData} />
                  </div>
                ) : (
                  <MoodTimeline data={moodData} />
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Your Top Songs</h2>
                {isLoadingTopTracks ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                  </div>
                ) : topTracksError ? (
                  <div className="text-white/70 p-4">{topTracksError}</div>
                ) : (
                  <div className="space-y-4">
                    {topTracks.slice(0, 5).map((track, index) => (
                      <div key={track.id} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 relative shrink-0">
                          {track.albumArt ? (
                            <Image
                              src={track.albumArt}
                              alt={track.album}
                              width={48}
                              height={48}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                              <MusicalNoteIcon className="w-6 h-6 text-white/40" />
                            </div>
                          )}
                          <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm font-medium text-white/80">
                            {index + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-white group-hover:text-purple-300 transition-colors">
                            {track.name}
                          </div>
                          <div className="truncate text-white/60 text-sm">
                            {track.artist}
                          </div>
                        </div>
                        {track.playCount && (
                          <div className="text-sm text-white/40">
                            {track.playCount} plays
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-semibold text-white">Genre Analysis</h2>
                {isLoadingGenreData ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
                  </div>
                ) : genreDataError ? (
                  <div className="text-white/70 p-4">{genreDataError}</div>
                ) : (
                  <GenreDistribution 
                    data={genreData.genreDistribution} 
                    timelineData={genreData.timelineData}
                    correlationData={genreData.correlationData}
                  />
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Top Albums This Week</h2>
                <div className="grid grid-cols-2 gap-4">
                  {topAlbums.slice(0, 10).map((album) => (
                    <div key={album.id} className="flex items-center gap-3 group">
                      <div className="w-16 h-16 shrink-0">
                        {album.image ? (
                          <Image
                            src={album.image}
                            alt={album.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                            <MusicalNoteIcon className="w-8 h-8 text-white/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-white group-hover:text-purple-300 transition-colors">
                          {album.name}
                        </div>
                        <div className="text-sm text-white/60">
                          {album.artist}
                        </div>
                        <div className="text-sm text-white/60">
                          {album.count} {album.count === 1 ? 'play' : 'plays'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 