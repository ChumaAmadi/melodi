export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { track, userId, playedAt } = body;

    if (!track?.name || !track?.artist) {
      console.error('Invalid track data:', track);
      return NextResponse.json(
        { error: 'Invalid track data' },
        { status: 400 }
      );
    }

    // Ensure genre is set
    const genre = track.genre || 'other';
    const subGenres = Array.isArray(track.subGenres) ? track.subGenres : [];

    console.log('Saving track with data:', {
      trackName: track.name,
      artistName: track.artist,
      genre,
      subGenres
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
      return NextResponse.json({
        trackName: existingTrack.trackName,
        artistName: existingTrack.artistName,
        genre: existingTrack.genre,
        subGenres: existingTrack.subGenres
      });
    }

    const savedTrack = await prisma.listeningHistory.create({
      data: {
        userId,
        trackId: track.id || 'unknown',
        trackName: track.name,
        artistName: track.artist,
        albumName: track.album || 'Unknown Album',
        playedAt: playedAt ? new Date(playedAt) : new Date(),
        duration: 0,
        genre,
        subGenres,
      },
    });

    // Return a clean response with just the needed fields
    return NextResponse.json({
      trackName: savedTrack.trackName,
      artistName: savedTrack.artistName,
      genre: savedTrack.genre,
      subGenres: savedTrack.subGenres
    });
  } catch (error) {
    console.error('Error saving track:', error);
    return NextResponse.json(
      { error: 'Failed to save track', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 