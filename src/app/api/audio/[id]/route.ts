import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const audio = await prisma.audioFile.findUnique({
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

