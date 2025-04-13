'use client';

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getTopTracks, getRecentlyPlayed, processRecentlyPlayed } from "@/lib/spotify";
import MoodTimeline from "./MoodTimeline";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import JournalSection from "./JournalSection";

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
  
  // Get first name from full name
  const firstName = session?.user?.name?.split(' ')[0] || '';
  
  // Calculate the current week's date range
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const dateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  
  const [moodData, setMoodData] = useState<MoodData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    nostalgic: [35, 45, 20, 45, 25, 15, 35],
    calm: [40, 30, 30, 30, 35, 25, 25],
    energetic: [25, 25, 50, 25, 40, 60, 40],
  });

  useEffect(() => {
    async function fetchMusicData() {
      if (session) {
        const [topTracksData, recentTracksData] = await Promise.all([
          getTopTracks(session),
          getRecentlyPlayed(session)
        ]);

        if (topTracksData) setTopTracks(topTracksData);
        if (recentTracksData) {
          const processedData = processRecentlyPlayed(recentTracksData);
          setTopAlbums(processedData.topAlbums);
          setTopArtists(processedData.topArtists);
        }
      }
    }

    fetchMusicData();
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
            width={32}
            height={32}
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

      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Week in Music</h2>
            <span className="text-sm text-white/70">{dateRange}</span>
          </div>
          
          <div className="mb-6">
            <MoodTimeline data={moodData} />
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Top Songs</h2>
          <div className="space-y-4">
            {topTracks.map((track) => (
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
          </div>
        </section>
      </main>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <JournalSection />
        </div>
      </div>
    </div>
  );
} 