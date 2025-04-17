import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const GENIUS_API_KEY = process.env.GENIUS_API_KEY;
const GENIUS_BASE_URL = 'https://api.genius.com';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

async function searchSong(track: string, artist: string) {
  const response = await fetch(
    `${GENIUS_BASE_URL}/search?q=${encodeURIComponent(
      `${track} ${artist}`
    )}`,
    {
      headers: {
        Authorization: `Bearer ${GENIUS_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search song on Genius');
  }

  const data = await response.json();
  return data.response.hits[0]?.result;
}

async function getLyrics(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch lyrics page');
    
    const html = await response.text();
    
    // Extract lyrics from the HTML using a more compatible regex approach
    const lyricsDiv = html.split('<div class="lyrics">')[1];
    if (!lyricsDiv) throw new Error('No lyrics found');
    
    const lyrics = lyricsDiv.split('</div>')[0]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\[.+?\]/g, '') // Remove section headers [Verse], [Chorus], etc.
      .trim();
    
    return lyrics;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const artist = searchParams.get('artist');

    if (!track || !artist) {
      return NextResponse.json(
        { error: 'Missing track or artist parameter' },
        { status: 400 }
      );
    }

    // Search for the song on Genius
    const song = await searchSong(track, artist);
    if (!song) {
      return NextResponse.json({ lyrics: null });
    }

    // Get the lyrics
    const lyrics = await getLyrics(song.url);

    return NextResponse.json({ lyrics });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    );
  }
} 