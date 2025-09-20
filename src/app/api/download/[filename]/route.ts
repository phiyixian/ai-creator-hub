import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ filename: string }> | { filename: string } }) {
  const resolvedParams = typeof (ctx as any)?.params?.then === "function" ? await (ctx as any).params : (ctx as any).params;
  const filename = resolvedParams?.filename;
  
  if (!filename) {
    return new Response("Filename required", { status: 400 });
  }

  const url = new URL(req.url);
  const sourceUrl = url.searchParams.get("url");
  const type = url.searchParams.get("type") || "image";

  if (!sourceUrl) {
    return new Response("Source URL required", { status: 400 });
  }

  try {
    // Fetch the file from the source URL
    const response = await fetch(sourceUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const mimeType = getMimeType(filename, type);

    // Return the file with appropriate headers for download
    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    return Response.json({ 
      error: "Download failed", 
      message: error.message 
    }, { status: 500 });
  }
}

function getMimeType(filename: string, type: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  };

  return extension ? (mimeTypes[extension] || 'application/octet-stream') : 'application/octet-stream';
}