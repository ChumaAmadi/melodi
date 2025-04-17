import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverFunctions } from '@/lib/spotify';
import { auth } from '@/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [topTracks, recentlyPlayed, stats] = await Promise.all([
      serverFunctions.getTopTracks(session),
      serverFunctions.getRecentlyPlayed(session),
      serverFunctions.getListeningStats(user.id)
    ]);

    return NextResponse.json({
      topTracks,
      recentlyPlayed,
      stats
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 