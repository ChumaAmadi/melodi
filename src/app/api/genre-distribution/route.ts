import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { normalizeGenre } from '@/lib/genreMapping';
import { GENRE_COLORS } from '@/lib/constants/colors';

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

    const today = new Date();
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);

    console.log('Fetching listening history for date range:', {
      startDate,
      endDate
    });

    const [listeningHistory, correlations] = await Promise.all([
      prisma.listeningHistory.findMany({
        where: {
          userId: user.id,
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          playedAt: 'asc',
        },
      }),
      prisma.genreMoodCorrelation.findMany({
        where: {
          userId: user.id,
        },
      }),
    ]);

    console.log('Raw listening history:', listeningHistory.length, 'tracks');

    const genreCounts: { [key: string]: number } = {};
    listeningHistory.forEach(track => {
      if (!track.genre) {
        console.log('Track missing genre:', track.trackName);
        return;
      }

      const normalizedGenre = normalizeGenre(track.genre);
      genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
    });

    console.log('Processed genre counts:', genreCounts);

    const genreDistribution = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        color: GENRE_COLORS[name as keyof typeof GENRE_COLORS] || GENRE_COLORS.other,
      }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotals = Array(7).fill(0);
    const genreDailyCounts: { [genre: string]: number[] } = {};
    
    Object.keys(genreCounts).forEach(genre => {
      genreDailyCounts[genre] = Array(7).fill(0);
    });
    
    listeningHistory.forEach(track => {
      if (track.genre) {
        const normalizedGenre = normalizeGenre(track.genre);
        const dayIndex = new Date(track.playedAt).getDay();
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dailyTotals[adjustedDayIndex]++;
        genreDailyCounts[normalizedGenre][adjustedDayIndex]++;
      }
    });

    const timelineData = {
      labels: days,
      datasets: Object.entries(genreDailyCounts)
        .sort((a, b) => 
          Object.values(genreCounts)[Object.keys(genreCounts).indexOf(b[0])] -
          Object.values(genreCounts)[Object.keys(genreCounts).indexOf(a[0])]
        )
        .map(([genre, counts]) => ({
          label: genre.charAt(0).toUpperCase() + genre.slice(1),
          data: counts.map((count, index) => 
            dailyTotals[index] > 0 ? (count / dailyTotals[index]) * 100 : 0
          ),
          backgroundColor: GENRE_COLORS[genre as keyof typeof GENRE_COLORS] || GENRE_COLORS.other,
        })),
    };

    // Process correlation data
    const correlationData = Object.keys(genreCounts).map(genre => ({
      genre,
      moods: correlations
        .filter(c => normalizeGenre(c.genre) === normalizeGenre(genre))
        .map(c => ({
          mood: c.mood,
          strength: c.strength,
          count: c.count,
        })),
    }));

    return NextResponse.json({
      genreDistribution,
      timelineData,
      correlationData,
    });
  } catch (error) {
    console.error("Error fetching genre distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre distribution" },
      { status: 500 }
    );
  }
} 