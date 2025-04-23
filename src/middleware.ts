import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/signin' || 
                      path.startsWith('/api/auth') ||
                      path.startsWith('/_next') ||
                      path.includes('.');
                      
  const token = await getToken({ req: request });

  // If the user is not authenticated and trying to access protected routes
  if (!token && !isPublicPath) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and trying to access auth pages
  if (token && path === '/auth/signin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Set the BASE_URL for the server-side environment
  const currentHost = request.headers.get('host') || 'localhost:3000';

  // Handle protocol in different environments
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  // Vercel handles HTTPS automatically but we need to set it explicitly for other environments
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    process.env.NEXT_PUBLIC_BASE_URL = `${protocol}://${currentHost}`;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - api/spotify (spotify API routes)
     * - api/genre-cache (genre cache API routes)
     * - api/journal (journal API routes)
     * - api/lastfm (Last.fm API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/spotify|api/genre-cache|api/journal|api/lastfm|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 