import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Get group info
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: user.sub
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Build where clause for audio files
    const whereClause: any = { groupId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get total count for pagination
    const totalAudioFiles = await prisma.audioFile.count({ where: whereClause });

    // Get paginated audio files
    const audioFiles = await prisma.audioFile.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        originalName: true,
        blobUrl: true,
        blobId: true,
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
            category: { select: { id: true, name: true, description: true, color: true } },
            subcategory: { select: { id: true, name: true, categoryId: true } }
          }
        },
        // labels are not on AudioFile in current model
        // owner relation not selected here; use ownerId if needed
      }
    });

    const totalPages = Math.ceil(totalAudioFiles / limit);

    return NextResponse.json({ 
      group,
      audioFiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalAudioFiles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const { name, description, color } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to user
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: user.sub
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing group
    const nameConflict = await prisma.group.findFirst({
      where: {
        name: name.trim(),
        ownerId: user.sub,
        id: { not: groupId }
      }
    });

    if (nameConflict) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 400 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null
      }
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    // Check if group exists and belongs to user
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: user.sub
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Current schema has no audioFile.groupId; nothing to update

    // Delete the group
    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
