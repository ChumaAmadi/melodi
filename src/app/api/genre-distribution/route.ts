import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { format, startOfWeek, endOfWeek, subHours } from 'date-fns';
import { normalizeGenre } from '@/lib/genreMapping';
import { GENRE_COLORS } from '@/lib/constants/colors';

// Define all possible moods
const ALL_MOODS = ['Happy', 'Calm', 'Sad', 'Frustrated', 'Reflective', 'Inspired'];

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Add connection test to check if database is available
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (connectionError) {
      console.error("Database connection error:", connectionError);
      return NextResponse.json({ 
        error: "Database connection error", 
        message: "Unable to connect to the database. Please try again later.",
        code: "DB_CONNECTION_ERROR"
      }, { status: 503 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);

    // Fetch listening history and journal entries with timeout handling
    try {
      const [listeningHistory, journalEntries] = await Promise.all([
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
        prisma.journalEntry.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      ]);

      // Process genre distribution
      const genreCounts: { [key: string]: number } = {};
      const genreMoodCorrelations: { [key: string]: { [mood: string]: number } } = {};
      
      // Initialize helper function for genre-mood correlations
      function initializeGenreMoods(genre: string) {
        if (!genreMoodCorrelations[genre]) {
          genreMoodCorrelations[genre] = {
            Happy: 0,
            Calm: 0,
            Sad: 0,
            Frustrated: 0,
            Reflective: 0,
            Inspired: 0
          };
        }
      }

      // Process each journal entry
      journalEntries.forEach(entry => {
        if (!entry.selectedMood) return;

        // Find songs listened to within 2 hours before the journal entry
        const entryTime = new Date(entry.createdAt);
        const windowStart = subHours(entryTime, 2);

        const relevantTracks = listeningHistory.filter(track => {
          const trackTime = new Date(track.playedAt);
          return trackTime >= windowStart && trackTime <= entryTime && track.genre;
        });

        console.log(`Journal entry from ${format(entryTime, 'yyyy-MM-dd HH:mm')} with mood ${entry.selectedMood} has ${relevantTracks.length} relevant tracks`);

        // Update genre-mood correlations
        relevantTracks.forEach(track => {
          if (!track.genre) return;
          const normalizedGenre = normalizeGenre(track.genre);
          
          // Initialize genre with all moods if not exists
          initializeGenreMoods(normalizedGenre);
          
          // Update mood count for this genre
          if (entry.selectedMood && ALL_MOODS.includes(entry.selectedMood)) {
            genreMoodCorrelations[normalizedGenre][entry.selectedMood]++;
          }
        });
      });

      // Count total genre occurrences
      listeningHistory.forEach(track => {
        if (!track.genre) return;
        const normalizedGenre = normalizeGenre(track.genre);
        genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
        // Initialize genre moods if not already done
        initializeGenreMoods(normalizedGenre);
      });

      // Prepare genre distribution data
      const genreDistribution = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          color: GENRE_COLORS[name as keyof typeof GENRE_COLORS] || GENRE_COLORS.other,
        }));

      // Process correlation data
      const correlationData = Object.entries(genreMoodCorrelations).map(([genre, moods]) => {
        const totalMoodCount = Object.values(moods).reduce((sum, count) => sum + count, 0);
        
        // Only include genres that have mood data
        if (totalMoodCount === 0) return null;
        
        return {
          genre,
          moods: ALL_MOODS.map(mood => ({
            mood,
            strength: totalMoodCount > 0 ? (moods[mood] || 0) / totalMoodCount : 0,
            count: moods[mood] || 0
          }))
        };
      }).filter(Boolean); // Remove null entries
      
      console.log(`Processed ${correlationData.length} genre-mood correlations`);

      // If no genres were found, provide default data
      if (genreDistribution.length === 0) {
        const defaultGenres = [
          { name: 'pop', count: 0, color: GENRE_COLORS.pop },
          { name: 'rock', count: 0, color: GENRE_COLORS.rock },
          { name: 'electronic', count: 0, color: GENRE_COLORS.electronic }
        ];
        
        // Add default correlation data too
        const defaultCorrelations = [
          {
            genre: 'pop',
            moods: ALL_MOODS.map(mood => ({
              mood,
              strength: 0.2, // Default strength
              count: 0
            }))
          }
        ];
        
        return NextResponse.json({
          genreDistribution: defaultGenres,
          correlationData: defaultCorrelations,
          status: 'empty',
          message: 'No genre data available yet. Try playing some music or adding journal entries.'
        });
      }

      return NextResponse.json({
        genreDistribution,
        correlationData,
        status: 'success'
      });
      
    } catch (queryError: any) {
      console.error("Database query error:", queryError);
      
      // Handle PostgreSQL specific errors
      if (queryError.code) {
        // Connection termination errors
        if (queryError.code === '57P01' || queryError.code === '57P02' || queryError.code === '57P03') {
          return NextResponse.json({ 
            error: "Database connection terminated", 
            message: "The database connection was terminated. Please try again later.",
            code: queryError.code
          }, { status: 503 });
        }
        
        // Query timeout errors
        if (queryError.code === '57014') {
          return NextResponse.json({ 
            error: "Query timeout", 
            message: "The database query timed out. Please try again with a smaller date range.",
            code: queryError.code
          }, { status: 504 });
        }
      }
      
      throw queryError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error("Error fetching genre distribution:", error);
    
    // Return a more informative error response
    return NextResponse.json(
      { 
        error: "Failed to fetch genre distribution",
        message: "An unexpected error occurred while processing your request. Please try again later.",
        fallbackData: {
          genreDistribution: [
            { name: 'pop', count: 1, color: GENRE_COLORS.pop },
            { name: 'rock', count: 1, color: GENRE_COLORS.rock },
            { name: 'electronic', count: 1, color: GENRE_COLORS.electronic }
          ],
          correlationData: []
        }
      },
      { status: 500 }
    );
  }
} 