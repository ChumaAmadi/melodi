import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the journal entry
    await prisma.journalEntry.delete({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... existing code ...
} 