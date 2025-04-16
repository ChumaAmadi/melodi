import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
  const session = await getServerSession();
  
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

    // Get the date range for analysis
    const today = new Date();
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);

    // Fetch listening history and journal entries
    const [listeningHistory, journalEntries] = await Promise.all([
      prisma.listeningHistory.findMany({
        where: {
          userId: user.id,
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
          genre: { not: null },
        },
        orderBy: { playedAt: 'asc' },
      }),
      prisma.journalEntry.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          selectedMood: { not: null },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Calculate correlations
    const correlations = new Map<string, Map<string, { count: number, total: number }>>();
    
    journalEntries.forEach(entry => {
      if (!entry.selectedMood) return;
      
      // Find songs listened to within 2 hours before the journal entry
      const entryTime = new Date(entry.createdAt);
      const windowStart = new Date(entryTime.getTime() - 2 * 60 * 60 * 1000);
      
      const relevantTracks = listeningHistory.filter(track => {
        const trackTime = new Date(track.playedAt);
        return trackTime >= windowStart && trackTime <= entryTime && track.genre;
      });

      relevantTracks.forEach(track => {
        if (!track.genre) return;
        
        if (!correlations.has(track.genre)) {
          correlations.set(track.genre, new Map());
        }
        
        const genreCorrelations = correlations.get(track.genre)!;
        if (!genreCorrelations.has(entry.selectedMood!)) {
          genreCorrelations.set(entry.selectedMood!, { count: 0, total: 0 });
        }
        
        const correlation = genreCorrelations.get(entry.selectedMood!)!;
        correlation.count++;
        correlation.total++;
      });
    });

    // Convert correlations to array format
    const correlationData = Array.from(correlations.entries()).map(([genre, moodMap]) => ({
      genre,
      moods: Array.from(moodMap.entries()).map(([mood, data]) => ({
        mood,
        strength: data.count / data.total,
        count: data.count,
      })),
    }));

    // Update or create correlation records in the database
    await Promise.all(
      correlationData.flatMap(({ genre, moods }) =>
        moods.map(({ mood, strength, count }) =>
          prisma.genreMoodCorrelation.upsert({
            where: {
              userId_genre_mood: {
                userId: user.id,
                genre,
                mood,
              },
            },
            update: {
              strength,
              count,
            },
            create: {
              userId: user.id,
              genre,
              mood,
              strength,
              count,
            },
          })
        )
      )
    );

    return NextResponse.json(correlationData);
  } catch (error) {
    console.error("Error calculating genre-mood correlations:", error);
    return NextResponse.json(
      { error: "Failed to calculate genre-mood correlations" },
      { status: 500 }
    );
  }
} 