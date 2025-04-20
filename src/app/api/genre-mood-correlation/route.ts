import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { normalizeGenre } from '@/lib/genreMapping';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get journal entries and listening history for the past month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [journalEntries, listeningHistory] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: oneMonthAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.listeningHistory.findMany({
        where: {
          userId: user.id,
          playedAt: {
            gte: oneMonthAgo,
          },
        },
        orderBy: {
          playedAt: 'desc',
        },
      }),
    ]);

    // Map to store genre-mood correlations
    const correlations = new Map<string, Map<string, { count: number, total: number }>>();

    // Process each journal entry
    journalEntries.forEach(entry => {
      if (!entry.selectedMood) return;

      // Find songs listened to within 2 hours before the journal entry
      const entryTime = new Date(entry.createdAt);
      const windowStart = new Date(entryTime.getTime() - 2 * 60 * 60 * 1000);

      const relevantTracks = listeningHistory.filter(track => {
        const trackTime = new Date(track.playedAt);
        return trackTime >= windowStart && trackTime <= entryTime && track.genre;
      });

      // Process each relevant track
      relevantTracks.forEach(track => {
        if (!track.genre) return;

        const normalizedGenre = normalizeGenre(track.genre);

        if (!correlations.has(normalizedGenre)) {
          correlations.set(normalizedGenre, new Map());
        }

        const genreCorrelations = correlations.get(normalizedGenre)!;
        
        // Initialize mood correlation if it doesn't exist
        if (!genreCorrelations.has(entry.selectedMood!)) {
          genreCorrelations.set(entry.selectedMood!, { count: 0, total: 0 });
        }

        // Update correlation counts
        const moodCorrelation = genreCorrelations.get(entry.selectedMood!)!;
        moodCorrelation.count++;
        moodCorrelation.total++;
      });
    });

    // Convert correlations to array format
    const correlationData = Array.from(correlations.entries()).map(([genre, moodMap]) => ({
      genre,
      moods: Array.from(moodMap.entries()).map(([mood, data]) => ({
        mood,
        strength: data.count / data.total,
        count: data.count
      }))
    }));

    // Save correlations to database
    await Promise.all(
      correlationData.map(async (genreData) => {
        await Promise.all(
          genreData.moods.map(async (moodData) => {
            await prisma.genreMoodCorrelation.upsert({
              where: {
                userId_genre_mood: {
                  userId: user.id,
                  genre: genreData.genre,
                  mood: moodData.mood,
                },
              },
              update: {
                strength: moodData.strength,
                count: moodData.count,
              },
              create: {
                userId: user.id,
                genre: genreData.genre,
                mood: moodData.mood,
                strength: moodData.strength,
                count: moodData.count,
              },
            });
          })
        );
      })
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