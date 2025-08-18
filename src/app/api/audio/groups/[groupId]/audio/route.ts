import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const { audioFileIds } = await request.json();

    if (!audioFileIds || !Array.isArray(audioFileIds) || audioFileIds.length === 0) {
      return NextResponse.json(
        { error: 'Audio file IDs are required' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to user
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

    // Check if all audio files belong to the user
    const audioFiles = await prisma.audioFile.findMany({
      where: {
        id: { in: audioFileIds },
        ownerId: user.sub
      }
    });

    if (audioFiles.length !== audioFileIds.length) {
      return NextResponse.json(
        { error: 'Some audio files not found or not owned by user' },
        { status: 400 }
      );
    }

    // Add audio files to group
    await prisma.audioFile.updateMany({
      where: {
        id: { in: audioFileIds }
      },
      data: {
        groupId: groupId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Added ${audioFiles.length} audio file(s) to group "${group.name}"` 
    });
  } catch (error) {
    console.error('Error adding audio files to group:', error);
    return NextResponse.json(
      { error: 'Failed to add audio files to group' },
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
    const { audioFileIds } = await request.json();

    if (!audioFileIds || !Array.isArray(audioFileIds) || audioFileIds.length === 0) {
      return NextResponse.json(
        { error: 'Audio file IDs are required' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to user
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

    // Remove audio files from group
    await prisma.audioFile.updateMany({
      where: {
        id: { in: audioFileIds },
        groupId: groupId
      },
      data: {
        groupId: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Removed ${audioFileIds.length} audio file(s) from group "${group.name}"` 
    });
  } catch (error) {
    console.error('Error removing audio files from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove audio files from group' },
      { status: 500 }
    );
  }
}

