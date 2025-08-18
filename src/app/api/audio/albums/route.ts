import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/audio/albums - Fetch albums for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    const ownerId = searchParams.get('ownerId');
    const groupId = searchParams.get('groupId');

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      ownerId,
    };



    const albums = await prisma.album.findMany({
      where,
      include: {
        _count: {
          select: {
            audioFiles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

// POST /api/audio/albums - Create a new album
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, categoryId, subcategoryId, groupId, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Name and Owner ID are required' },
        { status: 400 }
      );
    }



    // Check if album name already exists for this user
    const existingAlbum = await prisma.album.findFirst({
      where: {
        name,
        ownerId,
      },
    });

    if (existingAlbum) {
      return NextResponse.json(
        { error: 'Album with this name already exists' },
        { status: 409 }
      );
    }

    // Create the album
    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId,
      },
      include: {
        _count: {
          select: {
            audioFiles: true,
          },
        },
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    );
  }
}
