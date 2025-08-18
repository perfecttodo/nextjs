import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get published episodes ordered by upload date descending
    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        skip: offset,
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
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          // category/subcategory moved under album
          album: {
            select: {
              id: true,
              name: true,
            }
          },
          // owner relation not selected; use ownerId if needed
        },
      }),
      prisma.episode.count({
        where: { status: 'published' },
      }),
    ]);

    // Group episodes by date for better organization
    const groupedByDate = episodes.reduce((acc, audio) => {
      const date = audio.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(audio);
      return acc;
    }, {} as Record<string, typeof episodes>);

    // Convert to array and sort by date descending
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    return NextResponse.json({
      episodes: groupedByDate,
      dates: sortedDates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching published episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published episodes' },
      { status: 500 }
    );
  }
}
