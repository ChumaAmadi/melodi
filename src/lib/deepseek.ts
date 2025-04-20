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
      
      Specifically, identify trends in these six mood categories:
      1. Happy - feelings of joy, contentment, and general positivity
      2. Calm - feelings of peace, relaxation, or tranquility
      3. Sad - feelings of melancholy, grief, or emotional weight
      4. Frustrated - feelings of irritation, anger, or being stuck
      5. Reflective - feelings of contemplation, introspection, or deep thinking
      6. Inspired - feelings of motivation, creativity, or excitement about possibilities
      
      For each day of the week (Monday through Sunday), estimate the percentage (0-100) for each mood category.
      Keep your response concise and personalized, under 250 words.
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
      Keep your response concise, under 100 words.
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
        max_tokens: 500
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

// Generate a short insight for the dashboard header
export async function generateHeaderInsight(moodAnalysis: string): Promise<string> {
  try {
    const prompt = `
      Based on the following mood analysis:
      
      ${moodAnalysis}
      
      Create a personalized welcome message that feels like it's coming directly from Melodi based on the user's music listening habits and journal entries. 
      
      The message should:
      - Begin with a personalized greeting
      - Reference a specific insight about their mood or music taste 
      - Be warm and conversational in tone
      - Feel tailored to their current emotional state
      - Be 15-20 words maximum
      - End with an ellipsis (...) to suggest there's more to explore
      
      Examples:
      - "Welcome back, your reflective jazz choices suggest you're in a thoughtful mood today..."
      - "Your upbeat playlist matches your journaled happiness this week..."
      - "We notice your music getting more energetic as your mood improves..."
    `;
    
    // Call DeepSeek AI API
    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are Melodi, a personal music and mood companion that speaks in a warm, friendly tone.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating header insight:', error);
    // Fallback messages if DeepSeek API fails
    const fallbackMessages = [
      "Welcome back! Your music tastes are evolving in interesting ways...",
      "We've missed your unique musical journey. Ready to explore more?...",
      "Your playlist tells a story that we're excited to help you discover...",
      "Your musical choices reveal fascinating patterns about your mood...",
      "Welcome to Melodi, where your music and mood create a unique story..."
    ];
    
    // Return a random fallback message
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
} 