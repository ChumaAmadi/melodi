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
  image: string;
  count: number;
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
            setTopAlbums(processedData.topAlbums.slice(0, 5));
            setTopArtists(processedData.topArtists.slice(0, 5));
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

      <main className="container mx-auto p-6 space-y-6 relative z-0">
        <MelodiChat
          userName={session?.user?.name || ''}
          journalEntries={journalEntries}
          listeningHistory={listeningHistory}
          dateRange={dateRange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Your Week in Music",
              content: (
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
              ),
              date: dateRange
            },
            {
              title: "Genre Analysis",
              content: (
                <div className="mb-6">
                  {isLoadingGenreData ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : genreDataError ? (
                    <div className="h-[300px] flex flex-col items-center justify-center">
                      <p className="text-white/70 mb-4">{genreDataError}</p>
                    </div>
                  ) : !genreData.genreDistribution || genreData.genreDistribution.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-white/70 text-center">No genre data available for this week.</p>
                    </div>
                  ) : (
                    <GenreDistribution 
                      data={genreData.genreDistribution || []} 
                      timelineData={genreData.timelineData || null}
                      correlationData={genreData.correlationData || null}
                    />
                  )}
                </div>
              ),
              date: dateRange
            }
          ].map((section, index) => (
            <section 
              key={section.title}
              className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 animate-fade-in opacity-0 [animation-fill-mode:forwards]`}
              style={{ animationDelay: `${(index + 2) * 200}ms` }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <span className="text-sm text-white/70">{section.date}</span>
              </div>
              {section.content}
            </section>
          ))}

          {[
            {
              title: "Your Top Songs",
              content: (
                <>
                  {isLoadingTopTracks ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : topTracksError ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <p className="text-white/70 text-center">{topTracksError}</p>
                    </div>
                  ) : topTracks.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <p className="text-white/70 text-center">No top tracks available for this week.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topTracks.map((track, idx) => (
                        <div 
                          key={track.id} 
                          className="flex items-center space-x-4 text-white animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          {track.albumArt && (
                            <Image
                              src={track.albumArt}
                              alt={track.album}
                              width={48}
                              height={48}
                              className="rounded-md hover:scale-105 transition-transform duration-200"
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
                  )}
                </>
              )
            },
            {
              title: "Top Albums This Week",
              content: (
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
              )
            },
            {
              title: "Top Artists This Week",
              content: (
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
              )
            },
            {
              title: "Top Playlists",
              content: (
                <div className="space-y-4">
                  {topPlaylists.map((playlist) => (
                    <div key={playlist.id} className="flex items-center space-x-4 text-white">
                      {playlist.image ? (
                        <Image
                          src={playlist.image}
                          alt={playlist.name}
                          width={48}
                          height={48}
                          className="rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-zinc-800 rounded-md flex items-center justify-center">
                          <MusicalNoteIcon className="w-8 h-8 text-zinc-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{playlist.name}</h3>
                        <p className="text-sm text-white/70">{playlist.trackCount} tracks • By {playlist.owner}</p>
                      </div>
                    </div>
                  ))}
                  {topPlaylists.length === 0 && (
                    <p className="text-white/70 text-sm">No playlists available</p>
                  )}
                </div>
              )
            }
          ].map((section, index) => (
            <section 
              key={section.title}
              className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 animate-fade-in opacity-0 [animation-fill-mode:forwards]`}
              style={{ animationDelay: `${(index + 4) * 200}ms` }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">{section.title}</h2>
              {section.content}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
} 