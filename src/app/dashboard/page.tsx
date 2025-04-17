import { getErrorState } from '@/lib/spotify';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { DashboardContent } from './DashboardContent';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default async function Dashboard() {
  const session = await auth();
  
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700">Please Sign In</h2>
          <p className="text-gray-600 mt-2">
            You need to be signed in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading your music data...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
} 