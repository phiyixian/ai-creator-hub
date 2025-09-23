import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    console.log("📥 /generate-script request:", { prompt });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Generate a detailed script and storyboard for a video based on this prompt: ${prompt}.`,
        },
      ],
    });

    const script = completion.choices[0].message?.content ?? "No script generated.";
    console.log("✅ /generate-script success");
    return NextResponse.json({ script });
  } catch (error: any) {
    console.error("❌ OpenAI error (generate-script):", error);
    return NextResponse.json(
      { error: 'Failed to generate script', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
