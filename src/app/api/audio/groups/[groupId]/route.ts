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

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: user.sub
      },
      include: {
        audioFiles: {
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
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              }
            },
            subcategory: {
              select: {
                id: true,
                name: true,
                description: true,
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
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ group });
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

    // Remove group from all audio files
    await prisma.audioFile.updateMany({
      where: { groupId: groupId },
      data: { groupId: null }
    });

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
