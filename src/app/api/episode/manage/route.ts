import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { deleteAudioFile } from '@/lib/blob';

// GET - List user's episodes
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

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
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
          language: true,
          description: true,
          originalWebsite: true,
          createdAt: true,
          updatedAt: true,
          album: {
            select: {
              id: true,
              name: true,
            }
          },
          // labels not on Episode in current model
        },
      }),
      prisma.episode.count({ where }),
    ]);

    return NextResponse.json({
      episodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
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
    const { id, title, status, language, description, originalWebsite, categoryId, subcategoryId, labelIds = [] } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    // Check if user owns the audio file
    const existingFile = await prisma.episode.findFirst({
      where: { id, ownerId: user.sub },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: 'Audio file not found or access denied' },
        { status: 404 }
      );
    }




    // Labels are not on Episode in current model; skip validation

    // Update the audio file
    const updatedFile = await prisma.episode.update({
      where: { id },
      data: {
        title: title.trim(),
        ...(status && { status }),
        ...(language !== undefined && { language }),
        ...(description !== undefined && { description }),
        ...(originalWebsite !== undefined && { originalWebsite }),
        // category/subcategory not on Episode in current model
        updatedAt: new Date(),
      },
      include: {}
    });

    return NextResponse.json({
      success: true,
      episode: updatedFile,
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
    const existingFile = await prisma.episode.findFirst({
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
    await prisma.episode.delete({
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
