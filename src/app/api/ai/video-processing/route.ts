import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const trimStart = formData.get('trimStart') as string;
    const trimEnd = formData.get('trimEnd') as string;
    console.log("📥 /video-processing request:", { fileName: file?.name, trimStart, trimEnd });

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ use a cross-platform tmp path
    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(tempDir, file.name);
    const outputFilePath = path.join(tempDir, `trimmed-${file.name}`);

    await fs.writeFile(tempFilePath, buffer);

    console.log("🔧 Running FFmpeg command...");
    const ffmpegCommand = `ffmpeg -y -i "${tempFilePath}" -ss ${trimStart} -to ${trimEnd} -c copy "${outputFilePath}"`;
    console.log(ffmpegCommand);

    await execPromise(ffmpegCommand);

    const trimmedFileBuffer = await fs.readFile(outputFilePath);

    await fs.unlink(tempFilePath);
    await fs.unlink(outputFilePath);

    console.log("✅ /video-processing success");
    return new NextResponse(new Uint8Array(trimmedFileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="trimmed_${file.name}"`,
      },
    });
  } catch (error: any) {
    console.error("❌ FFmpeg error (video-processing):", error);
    return NextResponse.json(
      { error: 'Video processing failed', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
