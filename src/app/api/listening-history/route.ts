import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/listening-history
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's listening history for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const listeningHistory = await prisma.listeningHistory.findMany({
      where: {
        userId: user.id,
        playedAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
    });
    
    return NextResponse.json({ listeningHistory });
  } catch (error) {
    console.error('Error fetching listening history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listening history' },
      { status: 500 }
    );
  }
}

// POST /api/listening-history
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { tracks } = body;
    
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Create listening history records
    const listeningHistory = await prisma.listeningHistory.createMany({
      data: tracks.map((track: any) => ({
        userId: user.id,
        trackId: track.id,
        trackName: track.name,
        artistName: track.artists[0].name,
        albumName: track.album.name,
        playedAt: new Date(track.played_at),
        duration: track.duration_ms,
        energy: track.audio_features?.energy,
        valence: track.audio_features?.valence,
        tempo: track.audio_features?.tempo,
        key: track.audio_features?.key,
        mode: track.audio_features?.mode,
      })),
      skipDuplicates: true,
    });
    
    return NextResponse.json({ 
      message: 'Listening history saved successfully',
      count: listeningHistory.count
    });
  } catch (error) {
    console.error('Error saving listening history:', error);
    return NextResponse.json(
      { error: 'Failed to save listening history' },
      { status: 500 }
    );
  }
} 