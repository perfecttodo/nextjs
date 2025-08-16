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
    const { url, title, status = 'draft', duration = 0, categoryId, subcategoryId } = await request.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate subcategory if provided
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findFirst({
        where: {
          id: subcategoryId,
          categoryId: categoryId
        }
      });

      if (!subcategory) {
        return NextResponse.json(
          { error: 'Invalid subcategory for the selected category' },
          { status: 400 }
        );
      }
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
        categoryId: categoryId,
        subcategoryId: subcategoryId || null,
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