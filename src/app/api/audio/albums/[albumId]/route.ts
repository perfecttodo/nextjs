import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

// GET /api/audio/albums/[albumId] - Get album details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const resolved = await params;
    const albumId = resolved.albumId;

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        audioFiles: {
          select: {
            id: true,
            title: true,
            format: true,
            duration: true,
            fileSize: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            audioFiles: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}

// PUT /api/audio/albums/[albumId] - Update album
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const albumId = resolved.albumId;
    const body = await request.json();
    const { name, description, categoryId, groupId, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if album exists and belongs to the user
    const existingAlbum = await prisma.album.findFirst({
      where: {
        id: albumId,
        ownerId: user.sub,
      },
    });

    if (!existingAlbum) {
      return NextResponse.json(
        { error: 'Album not found or access denied' },
        { status: 404 }
      );
    }

    // Check if category exists (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Check if group exists and belongs to the user (if provided)
    if (groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          ownerId: user.sub,
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Check if album name already exists for this user (excluding current album)
    const duplicateAlbum = await prisma.album.findFirst({
      where: {
        name,
        ownerId: user.sub,
        id: { not: albumId },
      },
    });

    if (duplicateAlbum) {
      return NextResponse.json(
        { error: 'Album with this name already exists' },
        { status: 409 }
      );
    }

    // Update the album
    const updatedAlbum = await prisma.album.update({
      where: { id: albumId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId: categoryId || null,
        groupId: groupId || null,
        color: color || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            audioFiles: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAlbum);
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

// DELETE /api/audio/albums/[albumId] - Delete album
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const albumId = resolved.albumId;

    // Check if album exists and belongs to the user
    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        ownerId: user.sub,
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the album (this will also remove albumId from associated audio files due to onDelete: SetNull)
    await prisma.album.delete({
      where: { id: albumId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
