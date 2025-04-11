import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { generateMoodAnalysis, generateJournalEntry } from '@/lib/deepseek';

// GET /api/journal
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's journal entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        weekOf: 'desc',
      },
    });
    
    return NextResponse.json({ journalEntries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

// POST /api/journal
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the user's listening history for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const listeningHistory = await prisma.listeningHistory.findMany({
      where: {
        userId: user.id,
        playedAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        playedAt: 'asc',
      },
    });
    
    if (listeningHistory.length === 0) {
      return NextResponse.json(
        { error: 'No listening history found for the past week' },
        { status: 400 }
      );
    }
    
    // Generate mood analysis using DeepSeek AI
    const moodAnalysis = await generateMoodAnalysis(listeningHistory, {});
    
    // Generate journal entry using DeepSeek AI
    const journalContent = await generateJournalEntry(moodAnalysis, listeningHistory);
    
    // Create a new journal entry
    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        content: journalContent,
        moodSummary: moodAnalysis,
        weekOf: new Date(),
      },
    });
    
    return NextResponse.json({ 
      message: 'Journal entry created successfully',
      journalEntry
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
} 