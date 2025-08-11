import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { deleteAudioFile } from '@/lib/blob';

// GET - List user's audio files
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where = {
      ownerId: user.sub,
      ...(status && { status: status as 'draft' | 'published' }),
    };

    const [audioFiles, total] = await Promise.all([
      prisma.audioFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          originalName: true,
          blobUrl: true,
          format: true,
          duration: true,
          fileSize: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.audioFile.count({ where }),
    ]);

    return NextResponse.json({
      audioFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audio files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio files' },
      { status: 500 }
    );
  }
}

// PUT - Update audio file
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, status } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    // Check if user owns the audio file
    const existingFile = await prisma.audioFile.findFirst({
      where: { id, ownerId: user.sub },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: 'Audio file not found or access denied' },
        { status: 404 }
      );
    }

    // Update the audio file
    const updatedFile = await prisma.audioFile.update({
      where: { id },
      data: {
        title: title.trim(),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      audioFile: updatedFile,
    });
  } catch (error) {
    console.error('Error updating audio file:', error);
    return NextResponse.json(
      { error: 'Failed to update audio file' },
      { status: 500 }
    );
  }
}

// DELETE - Delete audio file
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Audio file ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the audio file
    const existingFile = await prisma.audioFile.findFirst({
      where: { id, ownerId: user.sub },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: 'Audio file not found or access denied' },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    await deleteAudioFile(existingFile.blobId);

    // Delete from database
    await prisma.audioFile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Audio file deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio file' },
      { status: 500 }
    );
  }
}
