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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <header className="w-full p-4 flex items-center justify-between bg-black/20">
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
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <JournalSection />
      </div>
    </div>
  );
} 