import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get Last.fm API key from environment variable
    const apiKey = process.env.LASTFM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Last.fm API key not configured' },
        { status: 500 }
      );
    }
    
    // Get params from URL
    const method = request.nextUrl.searchParams.get('method');
    const artist = request.nextUrl.searchParams.get('artist');
    const track = request.nextUrl.searchParams.get('track');
    
    if (!method) {
      return NextResponse.json(
        { error: 'Missing required parameter: method' },
        { status: 400 }
      );
    }
    
    // Build Last.fm API URL
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.append('method', method);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('format', 'json');
    
    // Add optional parameters
    if (artist) url.searchParams.append('artist', artist);
    if (track) url.searchParams.append('track', track);
    
    // Additional parameters from request
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (!['method', 'artist', 'track'].includes(key)) {
        url.searchParams.append(key, value);
      }
    }
    
    console.log(`Making Last.fm API request: ${url.toString().replace(apiKey, 'API_KEY')}`);
    
    // Fetch from Last.fm API
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Melodi/1.0.0'
      }
    });
    
    if (!response.ok) {
      console.error(`Last.fm API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Last.fm API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Check for Last.fm API error
    if (data.error) {
      console.error(`Last.fm API error: ${data.error} - ${data.message}`);
      return NextResponse.json(
        { error: data.message || `Last.fm API error: ${data.error}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying Last.fm request:', error);
    return NextResponse.json(
      { error: 'Failed to proxy Last.fm request' },
      { status: 500 }
    );
  }
} 