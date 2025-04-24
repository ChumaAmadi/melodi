export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Add CORS headers to the response
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track, userId, playedAt } = body;

    if (!track?.name || !track?.artist) {
      console.error('Invalid track data:', track);
      return corsHeaders(NextResponse.json(
        { error: 'Invalid track data' },
        { status: 400 }
      ));
    }

    // Ensure genre is set
    const genre = track.genre || 'other';
    const subGenres = Array.isArray(track.subGenres) ? track.subGenres : [];
    
    // Use track duration if available, default to an average of 3.5 minutes (210 seconds)
    const duration = track.duration || track.duration_ms ? Math.floor(track.duration_ms / 1000) : 210;

    console.log('Saving track with data:', {
      trackName: track.name,
      artistName: track.artist,
      genre,
      subGenres,
      duration
    });

    // Check if track already exists for this time
    const existingTrack = await prisma.listeningHistory.findFirst({
      where: {
        userId: userId,
        trackId: track.id,
        playedAt: playedAt ? new Date(playedAt) : undefined
      }
    });

    if (existingTrack) {
      return corsHeaders(NextResponse.json({
        trackName: existingTrack.trackName,
        artistName: existingTrack.artistName,
        genre: existingTrack.genre,
        subGenres: existingTrack.subGenres
      }));
    }

    const savedTrack = await prisma.listeningHistory.create({
      data: {
        userId,
        trackId: track.id || 'unknown',
        trackName: track.name,
        artistName: track.artist,
        albumName: track.album || 'Unknown Album',
        playedAt: playedAt ? new Date(playedAt) : new Date(),
        duration: duration,
        genre,
        subGenres,
      },
    });

    // Return a clean response with just the needed fields
    return corsHeaders(NextResponse.json({
      trackName: savedTrack.trackName,
      artistName: savedTrack.artistName,
      genre: savedTrack.genre,
      subGenres: savedTrack.subGenres
    }));
  } catch (error) {
    console.error('Error saving track:', error);
    return corsHeaders(NextResponse.json(
      { error: 'Failed to save track', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ));
  }
} 