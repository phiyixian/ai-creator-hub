import { NextResponse } from 'next/server';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import openai from '@/lib/openai';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    console.log("📥 /video-captions request:", { fileName: file?.name });

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ use a cross-platform tmp path
    const tempDir = path.join(process.cwd(), 'tmp');
    await fsp.mkdir(tempDir, { recursive: true });

    const tempVideoPath = path.join(tempDir, file.name);
    const tempAudioPath = path.join(tempDir, `${file.name}.mp3`);

    await fsp.writeFile(tempVideoPath, buffer);

    console.log("🔧 Extracting audio with FFmpeg:", tempVideoPath);
    await execPromise(`ffmpeg -y -i "${tempVideoPath}" -q:a 0 -map a "${tempAudioPath}"`);

    console.log("🎤 Sending to Whisper API:", tempAudioPath);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempAudioPath),
      model: "whisper-1",
    });

    await fsp.unlink(tempVideoPath);
    await fsp.unlink(tempAudioPath);

    console.log("✅ /video-captions success");
    return NextResponse.json({ captions: transcription.text });
  } catch (error: any) {
    console.error("❌ Whisper error (video-captions):", error);
    return NextResponse.json(
      { error: 'Failed to generate captions', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
