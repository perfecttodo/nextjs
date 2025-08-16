import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get published audio files ordered by upload date descending
    const [audioFiles, total] = await Promise.all([
      prisma.audioFile.findMany({
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
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.audioFile.count({
        where: { status: 'published' },
      }),
    ]);

    // Group audio files by date for better organization
    const groupedByDate = audioFiles.reduce((acc, audio) => {
      const date = audio.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(audio);
      return acc;
    }, {} as Record<string, typeof audioFiles>);

    // Convert to array and sort by date descending
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    return NextResponse.json({
      audioFiles: groupedByDate,
      dates: sortedDates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching published audio files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published audio files' },
      { status: 500 }
    );
  }
}
