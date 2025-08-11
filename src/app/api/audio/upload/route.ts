import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioFile } from '@/lib/blob';
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

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3, x-m4a, WAV, and OGG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Determine format from file type
    let format: 'mp3' | 'm4a' | 'wav' | 'ogg';
    switch (file.type) {
      case 'audio/mp3':
        format = 'mp3';
        break;
      case 'audio/x-m4a':
        format = 'm4a';
        break;
      case 'audio/wav':
        format = 'wav';
        break;
      case 'audio/ogg':
        format = 'ogg';
        break;
      default:
        format = 'mp3';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `audio/${user.sub}/${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blobResult = await uploadAudioFile(file, filename);

    // Save to database
    const audioFile = await prisma.audioFile.create({
      data: {
        title: title.trim(),
        originalName: file.name,
        blobUrl: blobResult.url,
        blobId: blobResult.blobId,
        format,
        fileSize: file.size,
        status: status || 'draft',
        ownerId: user.sub,
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
    console.error('Error uploading audio file:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
