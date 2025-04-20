import { NextResponse } from 'next/server';
import { ArtistGenreCache } from '@/lib/cache/artistGenreCache';

export async function GET() {
  try {
    await ArtistGenreCache.cleanup();
    return NextResponse.json({ status: 'success', message: 'Cache cleanup completed' });
  } catch (error) {
    console.error('Cache cleanup failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Cache cleanup failed' },
      { status: 500 }
    );
  }
} 