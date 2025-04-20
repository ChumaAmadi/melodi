import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { generateMoodAnalysis, generateJournalEntry } from '@/lib/deepseek';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/journal
export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    );
  }
}

// POST /api/journal
export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();
    if (!data.content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!data.selectedMood) {
      return NextResponse.json({ error: "Mood selection is required" }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        ...data,
        userId: user.id,
        weekOf: new Date(),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
} 