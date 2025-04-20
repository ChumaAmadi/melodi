const GENIUS_API_KEY = process.env.GENIUS_API_KEY;
const GENIUS_API_URL = 'https://api.genius.com';

export async function getGeniusLyrics(trackName: string, artistName: string): Promise<string | null> {
  try {
    // First, search for the song
    const searchResponse = await fetch(
      `${GENIUS_API_URL}/search?q=${encodeURIComponent(`${trackName} ${artistName}`)}`,
      {
        headers: {
          'Authorization': `Bearer ${GENIUS_API_KEY}`
        }
      }
    );

    const searchData = await searchResponse.json();
    
    if (!searchData.response?.hits?.length) {
      return null;
    }

    // Get the first hit's URL
    const songUrl = searchData.response.hits[0].result.url;

    // Fetch the lyrics page
    const lyricsResponse = await fetch(songUrl);
    const lyricsHtml = await lyricsResponse.text();

    // Extract lyrics from the HTML
    // Note: This is a simplified version. You might need to adjust the selector based on Genius's HTML structure
    const lyricsMatch = lyricsHtml.match(/<div class="Lyrics__Container-sc-1ynbvzw-1[^>]*>([\s\S]*?)<\/div>/);
    
    if (!lyricsMatch) {
      return null;
    }

    // Clean up the lyrics text
    const lyrics = lyricsMatch[1]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return lyrics;
  } catch (error) {
    console.error('Error fetching Genius lyrics:', error);
    return null;
  }
} 