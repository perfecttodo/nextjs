import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioFile } from '@/lib/r2';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const status = formData.get('status') as 'draft' | 'published';
    const language = formData.get('language') as string;
    const description = formData.get('description') as string;
    const originalWebsite = formData.get('originalWebsite') as string;
    const duration = formData.get('duration') as string;
    const categoryId = formData.get('categoryId') as string;
    const subcategoryId = formData.get('subcategoryId') as string;
    const groupId = formData.get('groupId') as string;
    const albumId = formData.get('albumId') as string;
    const labelIds = formData.getAll('labelIds') as string[];

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
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
        select: { id: true, categoryId: true, subcategoryId: true }
      });

      if (!album) {
        return NextResponse.json(
          { error: 'Invalid album' },
          { status: 400 }
        );
      }

      // If album has category/subcategory, enforce alignment
      if (album.categoryId && categoryId && album.categoryId !== categoryId) {
        return NextResponse.json(
          { error: 'Album category does not match selected category' },
          { status: 400 }
        );
      }
      if (album.subcategoryId && subcategoryId && album.subcategoryId !== subcategoryId) {
        return NextResponse.json(
          { error: 'Album subcategory does not match selected subcategory' },
          { status: 400 }
        );
      }
    }

    // Validate labels if provided
    if (labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: labelIds },
          OR: [
            { ownerId: null }, // System labels
            { ownerId: user.sub } // User's own labels
          ]
        }
      });

      if (labels.length !== labelIds.length) {
        return NextResponse.json(
          { error: 'One or more invalid labels' },
          { status: 400 }
        );
      }
    }

    // Normalize mime type (strip codecs params)
    const rawType = file.type || '';
    const baseType = rawType.split(';')[0].trim();

    // Validate file type (include common MediaRecorder outputs)
    const allowedTypes = new Set([
      'audio/mp3',
      'audio/mp4', // Safari MediaRecorder
      'audio/m4a',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg',
      'application/x-mpegurl',
      'audio/webm' // Chrome/Firefox MediaRecorder with opus
    ]);
    if (!allowedTypes.has(baseType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3, M4A/MP4, WAV, and OGG files are allowed. you upload '+baseType },
        { status: 400 }
      );
    }

    // Determine format from mime type
    let format: 'mp3' | 'm4a' | 'wav' | 'ogg'|'webm';
    switch (baseType) {
      case 'audio/mp3':
        format = 'mp3';
        break;
      case 'audio/x-m4a':
      case 'audio/m4a':
      case 'audio/mp4':
        format = 'm4a';
        break;
      case 'audio/wav':
        format = 'wav';
        break;
      case 'audio/ogg':
        format = 'ogg';
        break;
      case 'audio/webm':
        format = 'webm';
          break;
      default:
        // Fallback to mp3 naming, though we should never reach here due to validation
        format = 'mp3';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = (file.name || `recording.${format}`).replace(/\s+/g, '_');
    const filename = `${timestamp}-${safeName}`;

    // Upload to Vercel Blob
    const blobResult = await uploadAudioFile(file, filename);

    // Save to database
    const data = {
      title: title.trim(),
      originalName: file.name || safeName,
      blobUrl: blobResult.url,
      blobId: blobResult.blobId,
      format,
      fileSize: file.size,
      status: status || 'draft',
      ownerId: user.sub,
      language: language || null,
      description: description || null,
      originalWebsite: originalWebsite || null,
      duration: duration ? parseInt(duration) : 0,
      // Prefer album-level categorization if album provided and has category linkage
      categoryId: albumId ? undefined : categoryId,
      subcategoryId: albumId ? undefined : (subcategoryId || null),
      groupId: groupId || null,
      albumId: albumId || null,
    };
   // console.error('audioFile', data);

    const audioFile = await prisma.audioFile.create({
      data: {
        ...data,
        labels: labelIds.length > 0 ? {
          connect: labelIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        labels: true
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
    console.error('Error uploading audio file:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
