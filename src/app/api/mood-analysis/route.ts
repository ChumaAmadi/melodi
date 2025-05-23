import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { generateMoodAnalysis } from '@/lib/deepseek';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/mood-analysis
export async function GET() {
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

    // Get journal entries for the past 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log('Fetched entries:', entries); // Debug log

    // Get listening history for the past 7 days
    const listeningHistory = await prisma.listeningHistory.findMany({
      where: {
        userId: user.id,
        playedAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        playedAt: "asc",
      },
    });

    // Generate mood analysis using DeepSeek
    let moodAnalysis = '';
    try {
      moodAnalysis = await generateMoodAnalysis(listeningHistory, entries);
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
      // Continue with fallback mechanism
    }
    
    // Process the mood analysis to extract mood scores
    const moodScores = processMoodAnalysis(moodAnalysis, entries);
    console.log('Generated mood scores:', moodScores); // Debug log
    
    return NextResponse.json(moodScores);
  } catch (error) {
    console.error("Error generating mood analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate mood analysis" },
      { status: 500 }
    );
  }
}

// Helper function to process mood analysis and extract mood scores
function processMoodAnalysis(analysis: string, entries: any[]) {
  // Default mood data structure with all zeros
  const moodData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    happy: [0, 0, 0, 0, 0, 0, 0],
    calm: [0, 0, 0, 0, 0, 0, 0],
    sad: [0, 0, 0, 0, 0, 0, 0],
    frustrated: [0, 0, 0, 0, 0, 0, 0],
    reflective: [0, 0, 0, 0, 0, 0, 0],
    inspired: [0, 0, 0, 0, 0, 0, 0],
  };

  // If we have entries, use them to populate the mood data
  if (entries.length > 0) {
    // Create counters for each day to handle multiple entries
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const tempMoodData = {
      happy: [0, 0, 0, 0, 0, 0, 0],
      calm: [0, 0, 0, 0, 0, 0, 0],
      sad: [0, 0, 0, 0, 0, 0, 0],
      frustrated: [0, 0, 0, 0, 0, 0, 0],
      reflective: [0, 0, 0, 0, 0, 0, 0],
      inspired: [0, 0, 0, 0, 0, 0, 0],
    };

    entries.forEach(entry => {
      const dayIndex = new Date(entry.createdAt).getDay();
      // Convert Sunday (0) to 6, and other days to 0-5
      const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      dayCounts[adjustedDayIndex]++;
      
      // Add mood values based on the selected mood
      switch (entry.selectedMood?.toLowerCase()) {
        case 'happy':
          tempMoodData.happy[adjustedDayIndex] += 90;
          tempMoodData.inspired[adjustedDayIndex] += 40;
          tempMoodData.calm[adjustedDayIndex] += 30;
          break;
        case 'calm':
          tempMoodData.calm[adjustedDayIndex] += 90;
          tempMoodData.reflective[adjustedDayIndex] += 40;
          tempMoodData.sad[adjustedDayIndex] += 20;
          break;
        case 'sad':
          tempMoodData.sad[adjustedDayIndex] += 80;
          tempMoodData.reflective[adjustedDayIndex] += 40;
          tempMoodData.frustrated[adjustedDayIndex] += 20;
          break;
        case 'frustrated':
          tempMoodData.frustrated[adjustedDayIndex] += 80;
          tempMoodData.sad[adjustedDayIndex] += 30;
          tempMoodData.inspired[adjustedDayIndex] += 20;
          break;
        case 'reflective':
          tempMoodData.reflective[adjustedDayIndex] += 90;
          tempMoodData.calm[adjustedDayIndex] += 50;
          tempMoodData.sad[adjustedDayIndex] += 30;
          break;
        case 'inspired':
          tempMoodData.inspired[adjustedDayIndex] += 90;
          tempMoodData.happy[adjustedDayIndex] += 60;
          tempMoodData.reflective[adjustedDayIndex] += 30;
          break;
        default:
          // Default values if mood not recognized
          tempMoodData.calm[adjustedDayIndex] += 20;
          tempMoodData.happy[adjustedDayIndex] += 20;
          tempMoodData.reflective[adjustedDayIndex] += 20;
          tempMoodData.sad[adjustedDayIndex] += 20;
          tempMoodData.frustrated[adjustedDayIndex] += 20;
          tempMoodData.inspired[adjustedDayIndex] += 20;
      }
    });

    // Calculate averages for days with multiple entries
    for (let i = 0; i < 7; i++) {
      if (dayCounts[i] > 0) {
        moodData.happy[i] = Math.round(tempMoodData.happy[i] / dayCounts[i]);
        moodData.calm[i] = Math.round(tempMoodData.calm[i] / dayCounts[i]);
        moodData.sad[i] = Math.round(tempMoodData.sad[i] / dayCounts[i]);
        moodData.frustrated[i] = Math.round(tempMoodData.frustrated[i] / dayCounts[i]);
        moodData.reflective[i] = Math.round(tempMoodData.reflective[i] / dayCounts[i]);
        moodData.inspired[i] = Math.round(tempMoodData.inspired[i] / dayCounts[i]);
      }
    }
  }

  // If we have AI analysis and entries, try to enhance the mood data
  if (analysis && entries.length > 0) {
    try {
      // Look for patterns like "Monday: Happy: 70%, Calm: 30%, Sad: 40%, Frustrated: 20%, Reflective: 60%, Inspired: 50%"
      const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*Happy:\s*(\d+)%,\s*Calm:\s*(\d+)%,\s*Sad:\s*(\d+)%,\s*Frustrated:\s*(\d+)%,\s*Reflective:\s*(\d+)%,\s*Inspired:\s*(\d+)%/gi;
      let match;
      
      while ((match = dayPattern.exec(analysis)) !== null) {
        const day = match[1];
        const happy = parseInt(match[2], 10);
        const calm = parseInt(match[3], 10);
        const sad = parseInt(match[4], 10);
        const frustrated = parseInt(match[5], 10);
        const reflective = parseInt(match[6], 10);
        const inspired = parseInt(match[7], 10);
        
        // Map day name to index (0 = Monday, 6 = Sunday)
        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
        
        if (dayIndex !== -1) {
          // Only update if we don't already have data for this day from journal entries
          if (moodData.happy[dayIndex] === 0) {
            moodData.happy[dayIndex] = happy;
          }
          if (moodData.calm[dayIndex] === 0) {
            moodData.calm[dayIndex] = calm;
          }
          if (moodData.sad[dayIndex] === 0) {
            moodData.sad[dayIndex] = sad;
          }
          if (moodData.frustrated[dayIndex] === 0) {
            moodData.frustrated[dayIndex] = frustrated;
          }
          if (moodData.reflective[dayIndex] === 0) {
            moodData.reflective[dayIndex] = reflective;
          }
          if (moodData.inspired[dayIndex] === 0) {
            moodData.inspired[dayIndex] = inspired;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing mood analysis:', error);
      // If parsing fails, we'll still have the data from journal entries if available
    }
  }

  return moodData;
} 