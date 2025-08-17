import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subcategories: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get audio files by category with pagination
    const [audioFiles, total] = await Promise.all([
      prisma.audioFile.findMany({
        where: { 
          status: 'published',
          categoryId: categoryId
        },
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
          language: true,
          description: true,
          originalWebsite: true,
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
      }),
      prisma.audioFile.count({
        where: { 
          status: 'published',
          categoryId: categoryId
        },
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
      category,
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
    console.error('Error fetching audio files by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio files by category' },
      { status: 500 }
    );
  }
}
