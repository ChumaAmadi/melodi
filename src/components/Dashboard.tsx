'use client';

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl text-white">
        <div className="flex items-center space-x-6 mb-8">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "Profile"}
              width={80}
              height={80}
              className="rounded-full border-2 border-white"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">Welcome, {session?.user?.name}!</h1>
            <p className="text-gray-300">{session?.user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="px-6 py-2 border border-white/50 text-white rounded-full hover:bg-white/10 transition-colors duration-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
} 