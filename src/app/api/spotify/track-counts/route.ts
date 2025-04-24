import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Add CORS headers to the response
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify user is authenticated
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      console.error("Unauthorized access attempt to track-counts API:", { 
        hasSession: !!session,
        hasUser: !!session?.user,
        requestHeaders: Object.fromEntries(request.headers)
      });
      
      return corsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    // Find user either by email or id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: session.user.email || '' },
          { id: session.user.id || '' }
        ]
      },
    });

    if (!user) {
      console.error("User not found in database:", { sessionUser: session.user });
      return corsHeaders(NextResponse.json({ error: "User not found" }, { status: 404 }));
    }

    // Parse the request body
    const body = await request.json();
    const { trackIds } = body;

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return corsHeaders(NextResponse.json([]));
    }

    console.log(`Fetching play counts for ${trackIds.length} tracks for user ${user.id}`);

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
    
    return corsHeaders(NextResponse.json(results));
  } catch (error) {
    console.error('Error getting track counts:', error);
    return corsHeaders(NextResponse.json(
      { error: 'Failed to get track counts' },
      { status: 500 }
    ));
  }
} 