import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const GENRE_COLORS = {
  pop: '#FF6B6B',
  rock: '#4ECDC4',
  hiphop: '#45B7D1',
  electronic: '#96CEB4',
  jazz: '#FFEEAD',
  classical: '#D4A5A5',
  indie: '#9B5DE5',
  rnb: '#F15BB5',
  rap: '#FFB067',
  other: 'rgba(255, 255, 255, 0.2)'
};

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    console.error('No user email in session');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('User not found:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the date range for the past week
    const today = new Date();
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);

    console.log('Fetching listening history for date range:', {
      userId: user.id,
      startDate,
      endDate
    });

    // Fetch listening history and genre-mood correlations
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

    console.log('Raw listening history:', {
      totalTracks: listeningHistory.length,
      tracks: listeningHistory.map(t => ({
        name: t.trackName,
        artist: t.artistName,
        genre: t.genre,
        playedAt: t.playedAt
      }))
    });

    // Process genre distribution
    const genreCounts: { [key: string]: number } = {};
    listeningHistory.forEach(track => {
      if (!track.genre) {
        console.log('Track missing genre:', {
          name: track.trackName,
          artist: track.artistName,
          playedAt: track.playedAt
        });
        return;
      }
      genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
    });

    console.log('Processed genre counts:', genreCounts);

    // Format data for the pie chart
    const genreDistribution = Object.entries(genreCounts).map(([name, count]) => ({
      name,
      count,
      color: GENRE_COLORS[name as keyof typeof GENRE_COLORS] || GENRE_COLORS.other,
    }));

    console.log('Final genre distribution:', genreDistribution);

    // Process timeline data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // First, calculate total plays per day and plays per genre per day
    const dailyTotals = Array(7).fill(0);
    const genreDailyCounts: { [genre: string]: number[] } = {};
    
    // Initialize counts for each genre
    Object.keys(genreCounts).forEach(genre => {
      genreDailyCounts[genre] = Array(7).fill(0);
    });
    
    // Count plays for each genre per day and total plays per day
    listeningHistory.forEach(track => {
      if (track.genre) {
        const dayIndex = new Date(track.playedAt).getDay();
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dailyTotals[adjustedDayIndex]++;
        genreDailyCounts[track.genre][adjustedDayIndex]++;
      }
    });
    
    // Convert counts to percentages
    const timelineData = {
      labels: days,
      datasets: Object.keys(genreCounts).map(genre => {
        const percentages = genreDailyCounts[genre].map((count, index) => 
          dailyTotals[index] > 0 ? (count / dailyTotals[index]) * 100 : 0
        );
        return {
          label: genre.charAt(0).toUpperCase() + genre.slice(1),
          data: percentages,
          backgroundColor: GENRE_COLORS[genre as keyof typeof GENRE_COLORS] || GENRE_COLORS.other,
        };
      }),
    };

    // Process correlation data
    const correlationData = Object.keys(genreCounts).map(genre => ({
      genre,
      moods: correlations
        .filter(c => c.genre === genre)
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

// Temporary helper function to simulate genre data
// In a real application, this would come from the track metadata
function getRandomGenre(): keyof typeof GENRE_COLORS {
  const genres = Object.keys(GENRE_COLORS);
  return genres[Math.floor(Math.random() * (genres.length - 1))] as keyof typeof GENRE_COLORS;
} 