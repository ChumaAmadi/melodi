import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { getArtistGenres, setArtistGenres } from '@/lib/cache/genreCache';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Add CORS headers to the response
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

// GET /api/genre-cache?artist=ArtistName
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get('artist');
  
  if (!artist) {
    return corsHeaders(NextResponse.json({ error: "Artist name is required" }, { status: 400 }));
  }

  try {
    const genres = await getArtistGenres(decodeURIComponent(artist));
    
    return corsHeaders(NextResponse.json({ genres }));
  } catch (error) {
    console.error("Error fetching from genre cache:", error);
    return corsHeaders(
      NextResponse.json(
        { error: "Failed to fetch from genre cache", genres: [] },
        { status: 500 }
      )
    );
  }
}

// POST /api/genre-cache
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { artistName, genres } = data;
    
    if (!artistName || !Array.isArray(genres)) {
      return corsHeaders(
        NextResponse.json(
          { error: "Artist name and genres array are required" },
          { status: 400 }
        )
      );
    }

    // Update the genre cache
    await setArtistGenres(artistName, genres);

    return corsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Error updating genre cache:", error);
    return corsHeaders(
      NextResponse.json(
        { error: "Failed to update genre cache" },
        { status: 500 }
      )
    );
  }
} 