import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache this endpoint

// Ensure CORS headers are set
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: Request) {
  console.log('API: /api/user/profile called');
  
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    console.error('API: User not authenticated or missing email');
    return corsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  try {
    console.log(`API: Fetching Spotify profile for ${session.user.email}`);
    
    if (!session.accessToken) {
      console.error('API: No access token in session');
      return corsHeaders(NextResponse.json({ 
        error: 'No Spotify access token found', 
        fallbackImage: session.user.image 
      }, { status: 400 }));
    }

    // Direct Spotify API call
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      },
      cache: 'no-store'
    });

    if (!spotifyResponse.ok) {
      const errorText = await spotifyResponse.text();
      console.error(`API: Spotify API error (${spotifyResponse.status}):`, errorText);
      
      return corsHeaders(NextResponse.json({ 
        error: `Spotify API error: ${spotifyResponse.status}`, 
        message: errorText,
        fallbackImage: session.user.image
      }, { status: spotifyResponse.status }));
    }

    const spotifyData = await spotifyResponse.json();
    console.log('API: Spotify profile data received:', JSON.stringify({
      name: spotifyData.display_name,
      imageCount: spotifyData.images?.length || 0
    }));
    
    // Log image details for debugging
    if (spotifyData.images && spotifyData.images.length > 0) {
      spotifyData.images.forEach((img: any, i: number) => {
        console.log(`API: Image ${i}:`, JSON.stringify(img));
      });
    } else {
      console.log('API: No images in Spotify profile');
    }

    // Return profile data with images
    const profile = {
      id: spotifyData.id,
      name: spotifyData.display_name,
      email: spotifyData.email,
      images: spotifyData.images || [],
      fallbackImage: session.user.image, // Include NextAuth image as fallback
      hasSpotifyImages: spotifyData.images && spotifyData.images.length > 0
    };

    console.log('API: Returning profile data with images:', profile.hasSpotifyImages);
    return corsHeaders(NextResponse.json(profile));
    
  } catch (error) {
    console.error('API: Error fetching user profile:', error);
    return corsHeaders(NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackImage: session.user.image 
    }, { status: 500 }));
  }
} 