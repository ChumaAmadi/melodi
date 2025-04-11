'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spotify-green to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return <Dashboard />;
}
