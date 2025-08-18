import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const audio = await prisma.episode.findUnique({
      where: { id },
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
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ audio });
  } catch (error) {
    console.error('Error fetching audio file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/episode/[id] - Update audio file
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { albumId } = body;

    // Check if audio file exists and belongs to the user
    const audio = await prisma.episode.findFirst({
      where: {
        id,
        ownerId: user.sub,
      },
    });

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file not found or access denied' },
        { status: 404 }
      );
    }

    // Update the audio file
    const updatedAudio = await prisma.episode.update({
      where: { id },
      data: {
        albumId: albumId || null,
      },
    });

    return NextResponse.json({ success: true, audio: updatedAudio });
  } catch (error) {
    console.error('Error updating audio file:', error);
    return NextResponse.json(
      { error: 'Failed to update audio file' },
      { status: 500 }
    );
  }
}

