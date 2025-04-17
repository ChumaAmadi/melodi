import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt } = await request.json();

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a music genre analysis expert. Analyze songs based on their characteristics and return genre predictions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get DeepSeek response');
    }

    const data = await response.json();
    const genres = data.choices[0].message.content.trim();

    return NextResponse.json({ genres });
  } catch (error) {
    console.error('Error in DeepSeek analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze with DeepSeek' },
      { status: 500 }
    );
  }
} 