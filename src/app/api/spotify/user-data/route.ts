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

export async function GET(request: Request) {
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

    // Get time period from URL query parameter
    const url = new URL(request.url);
    const timePeriod = url.searchParams.get('period') as 'day' | 'week' | 'month' | 'year' | 'all' || 'all';
    
    // Log the time period being used
    console.log(`Received request for user data with time period: ${timePeriod}`);

    // Get Spotify user profile with image
    const spotifyProfile = await serverFunctions.getUserProfile(session);

    // Process all requests in parallel
    const [topTracks, recentlyPlayed, stats, topArtist] = await Promise.all([
      serverFunctions.getTopTracks(session),
      serverFunctions.getRecentlyPlayed(session),
      serverFunctions.getListeningStats(user.id, timePeriod),
      serverFunctions.getTopArtists(session, 1).then(artists => artists && artists.length > 0 ? artists[0] : null)
    ]);

    // Log the stats we're returning
    console.log(`Returning stats for period ${timePeriod}:`, {
      totalTracks: stats?.totalTracks || 0,
      totalHours: stats?.totalHours || 0,
      topGenre: stats?.topGenre || ''
    });

    return corsHeaders(NextResponse.json({
      user: spotifyProfile,
      topTracks,
      recentlyPlayed,
      stats: {
        ...stats,
        // Ensure we always return the requested period
        timePeriod
      },
      topArtist
    }));
  } catch (error) {
    console.error('Error fetching user data:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 