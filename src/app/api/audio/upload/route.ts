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
    const filename = `audio/${user.sub}/${timestamp}-${safeName}`;

    // Upload to Vercel Blob
    const blobResult = await uploadAudioFile(file, filename);

    // Save to database
    const audioFile = await prisma.audioFile.create({
      data: {
        title: title.trim(),
        originalName: file.name || safeName,
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
