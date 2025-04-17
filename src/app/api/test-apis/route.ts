import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTrackTags, getArtistTags, getLyrics } from '@/lib/api-utils';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_BASE_URL = 'http://ws.audioscrobbler.com/2.0';
const GENIUS_API_KEY = process.env.GENIUS_API_KEY;
const GENIUS_BASE_URL = 'https://api.genius.com';

export async function GET(request: Request) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Test track info
    const track = "A Collection of Short Stories";
    const artist = "Houston Calls";

    // Test all API endpoints in parallel
    const [trackTags, artistTags, lyrics] = await Promise.all([
      getTrackTags(artist, track),
      getArtistTags(artist),
      getLyrics(artist, track)
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        trackTags,
        artistTags,
        lyrics
      }
    });
  } catch (error) {
    console.error('Error testing APIs:', error);
    return NextResponse.json(
      { error: 'Failed to test APIs' },
      { status: 500 }
    );
  }
} 