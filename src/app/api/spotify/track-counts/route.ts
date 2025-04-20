import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Get the session to verify user is authenticated
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();
    const { trackIds } = body;

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json([]);
    }

    console.log(`Fetching play counts for ${trackIds.length} tracks`);

    // Query the database for play counts
    const trackCounts = await prisma.listeningHistory.groupBy({
      by: ['trackId'],
      where: {
        userId: user.id,
        trackId: { in: trackIds }
      },
      _count: {
        trackId: true
      }
    });

    // Format the results
    const results = trackCounts.map(item => ({
      trackId: item.trackId,
      count: item._count.trackId
    }));

    console.log(`Found play counts for ${results.length} tracks`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error getting track counts:', error);
    return NextResponse.json(
      { error: 'Failed to get track counts' },
      { status: 500 }
    );
  }
} 