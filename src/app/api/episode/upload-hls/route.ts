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
    const m3u8File = formData.get('m3u8File') as File;
    const tsFiles = formData.getAll('tsFiles') as File[];
    const title = formData.get('title') as string;
    const status = formData.get('status') as 'draft' | 'published';
    const language = formData.get('language') as string;
    const description = formData.get('description') as string;
    const originalWebsite = formData.get('originalWebsite') as string;
    const duration = formData.get('duration') as string;
    const categoryId = formData.get('categoryId') as string;
    const albumId = formData.get('albumId') as string;

    if (!m3u8File || !title) {
      return NextResponse.json(
        { error: 'M3U8 file and title are required' },
        { status: 400 }
      );
    }

    // Validate M3U8 file type
    if (m3u8File.type !== 'application/x-mpegurl' && !m3u8File.name.endsWith('.m3u8')) {
      return NextResponse.json(
        { error: 'Invalid M3U8 file type' },
        { status: 400 }
      );
    }



    // Validate album if provided, and ensure its category/subcategory match when provided
    if (albumId) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          ownerId: user.sub
        },
        select: { id: true, categoryId: true, }
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


    // Generate unique folder name for this HLS upload
    const timestamp = Date.now();
    const safeName = (title || 'hls_recording').replace(/\s+/g, '_');
    const hlsFolder = `${timestamp}-${safeName}`;

    // Upload M3U8 playlist file
    const m3u8Filename = `${hlsFolder}/playlist.m3u8`;
    const m3u8BlobResult = await uploadAudioFile(m3u8File, m3u8Filename);

    // Upload TS segment files
    const tsFileResults = [];
    for (let i = 0; i < tsFiles.length; i++) {
      const tsFile = tsFiles[i];
      if (tsFile && tsFile.size > 0) {
        const tsFilename = `${hlsFolder}/segment_${i.toString().padStart(3, '0')}.ts`;
        const tsBlobResult = await uploadAudioFile(tsFile, tsFilename);
        tsFileResults.push({
          filename: tsFilename,
          url: tsBlobResult.url,
          blobId: tsBlobResult.blobId,
          size: tsFile.size
        });
      }
    }

    // Calculate total file size
    const totalFileSize = m3u8File.size + tsFileResults.reduce((sum, ts) => sum + ts.size, 0);

    // Save to database
    const data = {
      title: title.trim(),
      originalName: `${safeName}.m3u8`,
      blobUrl: m3u8BlobResult.url, // Main URL points to M3U8 playlist
      blobId: m3u8BlobResult.blobId,
      format: 'm3u8',
      fileSize: totalFileSize,
      status: status || 'draft',
      ownerId: user.sub,
      language: language || null,
      description: description || null,
      originalWebsite: originalWebsite || null,
      duration: duration ? parseInt(duration) : 0,
      albumId: albumId || null,
    };

    const episode = await prisma.episode.create({
      data: {
        ...data
      },
      include: {}
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
      },
      hlsInfo: {
        playlistUrl: m3u8BlobResult.url,
        segmentCount: tsFileResults.length,
        totalSize: totalFileSize,
        segments: tsFileResults
      }
    });
  } catch (error) {
    console.error('Error uploading HLS files:', error);
    return NextResponse.json(
      { error: 'Failed to upload HLS files' },
      { status: 500 }
    );
  }
}
