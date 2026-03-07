import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const albumId = process.env.BOT_ALBUM_ID;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    // Get published episodes ordered by upload date descending
    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where: { status: 'published',albumId: albumId},
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          originalName: true,
          blobUrl: true,
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



const data =  [{ "title": episodes[0].createdAt.toISOString().split('T')[0],
      "img": "",
      "urls": episodes.map((e: { title: any; blobUrl: any;createdAt:any })=>  {return {url:e.blobUrl,title:e.title}})
      
    }];
    const news = {  "id": 100,
  "channel": "News",
  "clean": 1,
  "data": data
  };
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching published episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published episodes' },
      { status: 500 }
    );
  }
}
