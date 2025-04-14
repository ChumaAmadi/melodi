'use client';

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getTopTracks, getRecentlyPlayed, processRecentlyPlayed } from "@/lib/spotify";
import MoodTimeline from "./MoodTimeline";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import JournalSection from "./JournalSection";
import MelodiChat from './MelodiChat';

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
  image: string;
  count: number;
}

interface MoodData {
  labels: string[];
  nostalgic: number[];
  calm: number[];
  energetic: number[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topAlbums, setTopAlbums] = useState<TopItem[]>([]);
  const [topArtists, setTopArtists] = useState<TopItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [listeningHistory, setListeningHistory] = useState<any[]>([]);
  
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
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(true);
  const [moodDataError, setMoodDataError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (session) {
        try {
          const [topTracksData, recentTracksData, journalData] = await Promise.all([
            getTopTracks(session),
            getRecentlyPlayed(session),
            fetch('/api/journal').then(res => res.json()),
          ]);

          if (topTracksData) setTopTracks(topTracksData);
          if (recentTracksData) {
            const processedData = processRecentlyPlayed(recentTracksData);
            setTopAlbums(processedData.topAlbums.slice(0, 5));
            setTopArtists(processedData.topArtists.slice(0, 5));
            setListeningHistory(recentTracksData);
          }
          if (journalData) setJournalEntries(journalData);
        } catch (error) {
          console.error('Error fetching data:', error);
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

    fetchData();
    fetchMoodData();
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <header className="w-full p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center space-x-2">
          <Image
            src="/melodi.png"
            alt="Melodi"
            width={35}
            height={35}
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold text-white">melodi</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            Sign out
          </button>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-white">{firstName}</span>
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "Profile"}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <MelodiChat
          userName={session?.user?.name || ''}
          journalEntries={journalEntries}
          listeningHistory={listeningHistory}
          dateRange={dateRange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your Week in Music</h2>
              <span className="text-sm text-white/70">{dateRange}</span>
            </div>
            
            <div className="mb-6">
              {isLoadingMoodData ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
          </section>

          <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Top Songs</h2>
            <div className="space-y-4">
              {topTracks.slice(0, 5).map((track) => (
                <div key={track.id} className="flex items-center space-x-4 text-white">
                  {track.albumArt && (
                    <Image
                      src={track.albumArt}
                      alt={track.album}
                      width={48}
                      height={48}
                      className="rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{track.name}</h3>
                    <p className="text-sm text-white/70">{track.artist}</p>
                  </div>
                  {track.playCount !== undefined && (
                    <span className="ml-auto text-sm text-white/60">
                      {track.playCount} plays
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Albums This Week</h2>
            <div className="space-y-4">
              {topAlbums.map((album) => (
                <div key={album.id} className="flex items-center space-x-4 text-white">
                  {album.image && (
                    <Image
                      src={album.image}
                      alt={album.name}
                      width={48}
                      height={48}
                      className="rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{album.name}</h3>
                    <p className="text-sm text-white/70">{album.count} plays</p>
                  </div>
                </div>
              ))}
              {topAlbums.length === 0 && (
                <p className="text-white/70 text-sm">No album data available for this week</p>
              )}
            </div>
          </section>

          <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Artists This Week</h2>
            <div className="space-y-4">
              {topArtists.map((artist) => (
                <div key={artist.id} className="flex items-center space-x-4 text-white">
                  {artist.image && (
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      width={48}
                      height={48}
                      className="rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{artist.name}</h3>
                    <p className="text-sm text-white/70">{artist.count} plays</p>
                  </div>
                </div>
              ))}
              {topArtists.length === 0 && (
                <p className="text-white/70 text-sm">No artist data available for this week</p>
              )}
            </div>
          </section>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <JournalSection />
          </div>
        </div>
      </main>
    </div>
  );
} 