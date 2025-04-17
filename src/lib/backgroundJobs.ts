import { Session } from "next-auth";
import { serverFunctions } from "./spotify";

export async function startBackgroundRefresh(userId: string, session: Session) {
  try {
    // Start background refresh of user's listening history
    const [topTracks, recentlyPlayed] = await Promise.all([
      serverFunctions.getTopTracks(session),
      serverFunctions.getRecentlyPlayed(session)
    ]);

    console.log('Background refresh completed for user:', userId);
    return { topTracks, recentlyPlayed };
  } catch (error) {
    console.error('Error in background refresh:', error);
    return null;
  }
} 