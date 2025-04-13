'use client';

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is already signed in, redirect to dashboard
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-800 to-purple-600">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-lg rounded-2xl text-center text-white">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Melodi</h1>
          <p className="text-lg text-gray-300">Connect with Spotify to start your musical journey</p>
        </div>
        
        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-full transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center space-x-3"
        >
          <Image
            src="/spotify-icon.png"
            alt="Spotify"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span>Sign in with Spotify</span>
        </button>
      </div>
    </div>
  );
} 