'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import JournalSection from "@/components/JournalSection";
import Image from "next/image";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

export default function JournalPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin");
    },
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated music notes */}
        <div className="absolute h-full w-full">
          <div className="absolute top-[10%] left-[5%] text-white/10 text-6xl animate-float" style={{animationDuration: '15s'}}>♪</div>
          <div className="absolute top-[25%] left-[80%] text-white/10 text-5xl animate-float" style={{animationDuration: '12s', animationDelay: '2s'}}>♫</div>
          <div className="absolute top-[60%] left-[15%] text-white/10 text-7xl animate-float" style={{animationDuration: '18s', animationDelay: '1s'}}>♩</div>
          <div className="absolute top-[75%] left-[70%] text-white/10 text-5xl animate-float" style={{animationDuration: '14s', animationDelay: '3s'}}>♬</div>
          <div className="absolute top-[40%] left-[40%] text-white/10 text-6xl animate-float" style={{animationDuration: '16s', animationDelay: '0.5s'}}>♪</div>
        </div>
        
        {/* Audio visualizer bars */}
        <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-center gap-1 px-4 opacity-20">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-gradient-to-t from-blue-400 to-purple-500 rounded-t-full"
              style={{
                height: `${Math.max(5, Math.sin(i * 0.2) * 20 + Math.random() * 60)}px`,
                animationDelay: `${i * 0.05}s`,
                animation: `visualizer ${2 + Math.random() * 3}s ease-in-out infinite alternate`
              }}
            ></div>
          ))}
        </div>
        
        {/* Pulsing circles */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-2/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        
        {/* Floating vinyl records */}
        <div className="absolute top-20 right-[10%] w-32 h-32 rounded-full border-8 border-white/5 bg-black/20 animate-spin-slow" style={{animationDuration: '15s'}}>
          <div className="absolute inset-0 rounded-full border-4 border-white/5 m-2"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 m-6"></div>
          <div className="absolute inset-0 rounded-full border-2 border-white/10 m-12"></div>
        </div>
        <div className="absolute bottom-40 left-[5%] w-20 h-20 rounded-full border-4 border-white/5 bg-black/20 animate-spin-slow" style={{animationDuration: '12s'}}>
          <div className="absolute inset-0 rounded-full border-2 border-white/5 m-1"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 m-3"></div>
          <div className="absolute inset-0 rounded-full border border-white/10 m-6"></div>
        </div>
      </div>
      
      <header className="w-full p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/melodi.png"
              alt="Melodi"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </Link>
        </div>
        {session?.user?.image && (
          <ProfileMenu
            userName={session.user.name || ''}
            userImage={session.user.image}
          />
        )}
      </header>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <JournalSection />
      </div>
      
      {/* Add animation keyframes */}
      <style jsx global>{`
        @keyframes visualizer {
          0% {
            height: 5px;
          }
          100% {
            height: 100%;
          }
        }
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(15px, -15px) rotate(5deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
      `}</style>
    </div>
  );
} 