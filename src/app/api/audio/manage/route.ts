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
          language: true,
          description: true,
          originalWebsite: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              description: true,
              categoryId: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          labels: {
            select: {
              id: true,
              name: true,
              color: true,
              description: true,
            }
          },
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
    const { id, title, status, language, description, originalWebsite, categoryId, subcategoryId, labelIds = [] } = body;

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
    if (subcategoryId && categoryId) {
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

    // Update the audio file
    const updatedFile = await prisma.audioFile.update({
      where: { id },
      data: {
        title: title.trim(),
        ...(status && { status }),
        ...(language !== undefined && { language }),
        ...(description !== undefined && { description }),
        ...(originalWebsite !== undefined && { originalWebsite }),
        ...(categoryId && { categoryId }),
        ...(subcategoryId && { subcategoryId }),
        labels: {
          set: [], // Clear existing labels
          connect: labelIds.map((id: string) => ({ id })) // Connect new labels
        },
        updatedAt: new Date(),
      },
      include: {
        labels: true
      }
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
