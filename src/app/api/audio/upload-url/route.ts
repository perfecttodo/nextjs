import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Changed from formData to JSON parsing since the frontend sends JSON
    const { url, title, status = 'draft', duration = 0 } = await request.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Extract file extension for format
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    let format: 'mp3' | 'm4a' | 'wav' | 'ogg'|'webm'|'m3u8'|'';

    if (pathname.endsWith('.mp3')) format = 'mp3';
    else if (pathname.endsWith('.m4a') || pathname.endsWith('.mp4')) format = 'm4a';
    else if (pathname.endsWith('.wav')) format = 'wav';
    else if (pathname.endsWith('.ogg')) format = 'ogg';
    else if (pathname.endsWith('.m3u8')) format = 'm3u8';
    else format = '';


    // Optionally: You might want to verify the file exists by making a HEAD request
    // This is commented out as it might slow down the response
    
   /* try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (!headResponse.ok) {
        return NextResponse.json(
          { error: 'Audio file not found at the provided URL' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify audio file at the provided URL' },
        { status: 400 }
      );
    }
    */

    // Save to database
    const audioFile = await prisma.audioFile.create({
      data: {
        title: title.trim(),
        originalName: title.trim(),
        blobUrl: url,
        blobId: `url-${Date.now()}`, // Create a unique ID for URL-based files
        format,
        fileSize: 0, // Can't determine size without downloading
        status,
        ownerId: user.sub,
        duration: typeof duration === 'string' ? parseInt(duration) : duration,
      },
    });

    return NextResponse.json({
      success: true,
      audioFile: {
        id: audioFile.id,
        title: audioFile.title,
        blobUrl: audioFile.blobUrl,
        format: audioFile.format,
        status: audioFile.status,
        createdAt: audioFile.createdAt,
      },
    });
  } catch (error) {
    console.error('Error processing audio URL:', error);
    return NextResponse.json(
      { error: 'Failed to process audio URL' },
      { status: 500 }
    );
  }
}