import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { detectArtistGenres } from '@/lib/genre-detection';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const artistName = searchParams.get('artist');

  if (!artistName) {
    return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
  }

  try {
    const genres = await detectArtistGenres(artistName);
    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Error detecting genres:", error);
    return NextResponse.json(
      { error: "Failed to detect genres" },
      { status: 500 }
    );
  }
} 