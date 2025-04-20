'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        <div className="text-red-300 mb-6">
          {error === 'Configuration' && (
            <p>There is a problem with the server configuration. Please contact support.</p>
          )}
          {error === 'AccessDenied' && (
            <p>You denied access to your Spotify account. Please try again and accept the permissions.</p>
          )}
          {error === 'RefreshAccessTokenError' && (
            <p>Failed to refresh access token. Please try signing in again.</p>
          )}
          {!error && (
            <p>An unknown error occurred during authentication. Please try again.</p>
          )}
        </div>
        <div className="flex justify-center">
          <Link
            href="/auth/signin"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
} 