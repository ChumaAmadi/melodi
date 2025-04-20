import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET /api/genre-cache?artist=artistName
export async function GET(request: Request) {
  try {
    // Get the session to verify user is authenticated
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get artist name from URL
    const url = new URL(request.url);
    const artistName = url.searchParams.get('artist');
    
    if (!artistName) {
      return NextResponse.json({ error: "Missing artist parameter" }, { status: 400 });
    }
    
    // Normalize artist name
    const normalizedArtistName = artistName.toLowerCase().trim();
    
    // Query the database for cached genres
    const dbCache = await prisma.artistGenreCache.findFirst({
      where: { 
        artistId: normalizedArtistName
      }
    });
    
    if (dbCache?.mainGenres && dbCache.mainGenres.length > 0) {
      return NextResponse.json({ 
        genres: dbCache.mainGenres,
        lastUpdated: dbCache.lastUpdated
      });
    }
    
    // No cache found
    return NextResponse.json({ genres: [] });
    
  } catch (error) {
    console.error('Error fetching from genre cache:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from genre cache' },
      { status: 500 }
    );
  }
}

// POST /api/genre-cache
export async function POST(request: Request) {
  try {
    // Get the session to verify user is authenticated
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { artistName, genres } = body;
    
    if (!artistName || !Array.isArray(genres)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Normalize artist name
    const normalizedArtistName = artistName.toLowerCase().trim();
    
    // Update database cache
    await prisma.artistGenreCache.upsert({
      where: { artistId: normalizedArtistName },
      update: {
        mainGenres: genres,
        lastUpdated: new Date()
      },
      create: {
        artistId: normalizedArtistName,
        mainGenres: genres,
        subGenres: [],
        lastUpdated: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Genre cache updated successfully"
    });
    
  } catch (error) {
    console.error('Error updating genre cache:', error);
    return NextResponse.json(
      { error: 'Failed to update genre cache' },
      { status: 500 }
    );
  }
} 