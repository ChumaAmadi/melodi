import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { chat, journalEntries, listeningHistory } = await req.json();
  const apiKey = process.env.DEEPSEEK_API_KEY;

  // Check if API key is configured
  if (!apiKey || apiKey === 'your_deepseek_api_key') {
    return NextResponse.json({ 
      message: "Hi! I'm currently in offline mode. To enable my full AI capabilities, please configure the DeepSeek API key. For now, I can still help you track your music and moods!" 
    });
  }

  // Compose a context prompt for DeepSeek
  let context = 'You are Melodi, a friendly, empathetic music therapist. Use the user\'s recent mood journals and Spotify listening data (artists, genres, tempo, etc.) to provide thoughtful, context-aware responses. If you notice a pattern (e.g., lots of sad music, or a specific artist/genre), mention it in your response. Always be supportive and ask open-ended questions.';

  try {
    // Add journal summary
    if (journalEntries && journalEntries.length > 0) {
      const recentMood = journalEntries[0].mood;
      context += ` The user\'s most recent mood journal says they felt: "${recentMood}".`;
    }

    // Add listening summary
    if (listeningHistory && listeningHistory.length > 0) {
      const artists = listeningHistory.map((t: { artist: any; }) => t.artist).filter(Boolean);
      const genres = listeningHistory.map((t: { genre: any; }) => t.genre).filter(Boolean);
      const tempos = listeningHistory.map((t: { tempo: any; }) => t.tempo).filter(Boolean);
      context += ` Recently, the user has been listening to artists like: ${[...new Set(artists)].slice(0,3).join(', ')}.`;
      if (genres.length > 0) context += ` Genres: ${[...new Set(genres)].slice(0,3).join(', ')}.`;
      if (tempos.length > 0) context += ` Tempos: ${[...new Set(tempos)].slice(0,3).join(', ')}.`;
    }

    // Compose the DeepSeek API payload
    const messages = [
      { role: 'system', content: context },
      ...chat.map((m: any) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      throw new Error('DeepSeek API error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I had trouble thinking of a response.';
    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Error in Melodi chat:', error);
    return NextResponse.json({ 
      message: "I'm having trouble connecting to my AI services right now. But I'm still here to help you track your music and moods! Feel free to share how you're feeling or check out your music stats." 
    });
  }
} 