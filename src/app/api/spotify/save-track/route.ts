export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { track, userId, playedAt } = body;

    // Check if track already exists for this time
    const existingTrack = await prisma.listeningHistory.findFirst({
      where: {
        userId: userId,
        trackId: track.id,
        playedAt: playedAt ? new Date(playedAt) : undefined
      }
    });

    if (existingTrack) {
      return NextResponse.json({ message: 'Track already exists' });
    }

    const savedTrack = await prisma.listeningHistory.create({
      data: {
        userId,
        trackId: track.id,
        trackName: track.name,
        artistName: track.artist,
        albumName: track.album,
        playedAt: playedAt ? new Date(playedAt) : new Date(),
        duration: 0,
        genre: track.genre,
        subGenres: track.subGenres || [],
      },
    });

    return NextResponse.json(savedTrack);
  } catch (error) {
    console.error('Error saving track:', error);
    return NextResponse.json({ error: 'Failed to save track' }, { status: 500 });
  }
} 