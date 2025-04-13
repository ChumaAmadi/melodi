import axios from 'axios';

interface DeepSeekResponse {
  choices: {
    text: string;
    finish_reason: string;
  }[];
}

export async function generateMoodAnalysis(
  listeningHistory: any[],
  journalEntries: any[]
): Promise<string> {
  try {
    // Format the listening history for the prompt
    const formattedHistory = listeningHistory
      .map(track => `${track.trackName} by ${track.artistName} (Energy: ${track.energy}, Valence: ${track.valence})`)
      .join('\n');
    
    // Format journal entries for the prompt
    const formattedEntries = journalEntries
      .map(entry => `Entry from ${new Date(entry.createdAt).toLocaleDateString()}: "${entry.content}" (Mood: ${entry.selectedMood})`)
      .join('\n');
    
    const prompt = `
      Based on the following music listening history and journal entries, analyze the user's emotional state and mood patterns:
      
      MUSIC LISTENING HISTORY:
      ${formattedHistory}
      
      JOURNAL ENTRIES:
      ${formattedEntries}
      
      Consider factors like:
      - Energy levels in music (high energy often indicates excitement or stress)
      - Genre of music (different genres can evoke different emotions)
      - Artist of music (different artists can evoke different emotions)
      - Album of music (different albums can evoke different emotions)
      - Valence in music (positive vs negative emotions)
      - Tempo (fast vs slow, indicating activity level)
      - Time of day patterns
      - Explicit mood selections in journal entries
      - Themes and emotions expressed in journal content
      
      Provide a thoughtful, empathetic analysis of what this data suggests about their emotional journey.
      Focus on patterns and potential emotional needs they might be expressing through their music choices and journal entries.
      
      Specifically, identify trends in these three mood categories:
      1. Nostalgic - feelings of longing, reminiscence, or connection to the past
      2. Calm - feelings of peace, relaxation, or contentment
      3. Energetic - feelings of excitement, motivation, or high activity
      
      For each day of the week (Monday through Sunday), estimate the percentage (0-100) for each mood category.
    `;
    
    // Check if we have a valid API key
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your_deepseek_api_key') {
      console.warn('DeepSeek API key is not properly configured');
      throw new Error('DeepSeek API key is not properly configured');
    }
    
    // Call DeepSeek AI API
    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a thoughtful music therapist who analyzes emotional patterns through music listening habits and journal entries.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error generating mood analysis:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
}

export async function generateJournalEntry(
  moodAnalysis: string,
  listeningHistory: any[]
): Promise<string> {
  try {
    const prompt = `
      Based on the following mood analysis of a user's music listening habits:
      
      ${moodAnalysis}
      
      Create a thoughtful, empathetic journal entry that helps the user reflect on their emotional journey this week.
      The entry should:
      - Acknowledge the emotional patterns identified
      - Offer gentle insights about what might be influencing their mood
      - Provide a supportive perspective on their emotional needs
      - End with a positive, encouraging note
      
      Write in a warm, conversational tone as if you're a supportive friend who understands them through their music.
    `;
    
    // Call DeepSeek AI API
    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a supportive friend who helps people reflect on their emotions through their music choices.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error generating journal entry:', error);
    return 'Unable to generate journal entry at this time.';
  }
} 