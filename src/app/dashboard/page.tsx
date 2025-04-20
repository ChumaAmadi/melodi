import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { Dashboard } from '@/components';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    const callbackUrl = encodeURI('/dashboard');
    redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
  }

  return <Dashboard />;
} 