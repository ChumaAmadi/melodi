import axios from 'axios';

interface DeepSeekResponse {
  choices: {
    text: string;
    finish_reason: string;
  }[];
}

export async function generateMoodAnalysis(
  listeningHistory: any[],
  userPreferences: any
): Promise<string> {
  try {
    // Format the listening history for the prompt
    const formattedHistory = listeningHistory
      .map(track => `${track.trackName} by ${track.artistName} (Energy: ${track.energy}, Valence: ${track.valence})`)
      .join('\n');
    
    const prompt = `
      Based on the following music listening history, analyze the user's emotional state and mood patterns:
      
      ${formattedHistory}
      
      Consider factors like:
      - Energy levels (high energy often indicates excitement or stress)
      - Valence (positive vs negative emotions)
      - Tempo (fast vs slow, indicating activity level)
      - Time of day patterns
      
      Provide a thoughtful, empathetic analysis of what this music suggests about their emotional journey.
      Focus on patterns and potential emotional needs they might be expressing through their music choices.
    `;
    
    // Call DeepSeek AI API
    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a thoughtful music therapist who analyzes emotional patterns through music listening habits.' },
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
    return 'Unable to analyze mood patterns at this time.';
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