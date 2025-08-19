import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playlistUrl, title, status = 'draft', language, description, originalWebsite, duration = 0, albumId } = await request.json();

    if (!playlistUrl || !title) {
      return NextResponse.json({ error: 'playlistUrl and title are required' }, { status: 400 });
    }

    // Derive a stable original name from title
    const safeName = String(title).trim().replace(/\s+/g, '_');
    const originalName = `${safeName}.m3u8`;

    const episode = await prisma.episode.create({
      data: {
        title: String(title).trim(),
        originalName,
        blobUrl: playlistUrl,
        blobId: playlistUrl, // optional: store key instead of URL if needed
        format: 'm3u8',
        fileSize: 0,
        status,
        ownerId: user.sub,
        language: language || null,
        description: description || null,
        originalWebsite: originalWebsite || null,
        duration: typeof duration === 'string' ? parseInt(duration) : duration,
        albumId: albumId || null,
      }
    });

    return NextResponse.json({
      success: true,
      episode: {
        id: episode.id,
        title: episode.title,
        blobUrl: episode.blobUrl,
        format: episode.format,
        status: episode.status,
        createdAt: episode.createdAt,
      }
    });
  } catch (error) {
    console.error('Error finalizing HLS episode:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


