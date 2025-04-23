import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/journal/count
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: "UserId is required" }, { status: 400 });
  }

  try {
    // Count journal entries for the user
    const count = await prisma.journalEntry.count({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting journal entries:", error);
    return NextResponse.json(
      { error: "Failed to count journal entries", count: 0 },
      { status: 500 }
    );
  }
} 