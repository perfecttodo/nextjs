import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextIDStr } from '@/lib/ID';

// GET /api/albums - Fetch albums (optionally filtered by owner) with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(pageSizeParam || '12', 10) || 12, 1), 50);

    // Build where clause (ownerId optional for public listing)
    const where: any = {};
    if (ownerId) where.ownerId = ownerId;



    const total = await prisma.album.count({ where });

    const albums = await prisma.album.findMany({
      where,
      include: {
        _count: {
          select: {
            episodes: {
              where: { status: 'published' }
            },
            
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      albums,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

// POST /api/albums - Create a new album
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
        id:await nextIDStr(),
        name: name.trim(),
        description: description?.trim() || null,
        ownerId,
      },
      include: {
        _count: {
          select: {
            episodes: true,
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
