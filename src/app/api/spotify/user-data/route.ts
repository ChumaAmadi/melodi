import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { serverFunctions } from '@/lib/spotify';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Add CORS headers to the response
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return corsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return corsHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    const [topTracks, recentlyPlayed, stats] = await Promise.all([
      serverFunctions.getTopTracks(session),
      serverFunctions.getRecentlyPlayed(session),
      serverFunctions.getListeningStats(user.id)
    ]);

    return corsHeaders(NextResponse.json({
      topTracks,
      recentlyPlayed,
      stats
    }));
  } catch (error) {
    console.error('Error fetching user data:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 