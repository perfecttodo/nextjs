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
    const { url, title, status = 'draft', description, originalWebsite, duration = 0, categoryId, subcategoryId, groupId, albumId, labelIds = [] } = await request.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
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

    // Validate group if provided
    if (groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          ownerId: user.sub
        }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Invalid group' },
          { status: 400 }
        );
      }
    }

    // Validate album if provided, and ensure its category/subcategory match when provided
    if (albumId) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          ownerId: user.sub
        },
        select: { id: true, categoryId: true }
      });

      if (!album) {
        return NextResponse.json(
          { error: 'Invalid album' },
          { status: 400 }
        );
      }

      if (album.categoryId && categoryId && album.categoryId !== categoryId) {
        return NextResponse.json(
          { error: 'Album category does not match selected category' },
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

    // Validate labels if provided
    if (labelIds.length > 0) {
      const labels = await prisma.label.findMany({ where: { id: { in: labelIds } } });
      if (labels.length !== labelIds.length) {
        return NextResponse.json(
          { error: 'One or more invalid labels' },
          { status: 400 }
        );
      }
    }

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
        description: description || null,
        originalWebsite: originalWebsite || null,
        duration: typeof duration === 'string' ? parseInt(duration) : duration,
        albumId: albumId || null,
      }
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