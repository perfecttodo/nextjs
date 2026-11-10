import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { doIt } from '@/app/api/episode/bot-sync';
const albumId = process.env.BOT_ALBUM_ID;

export async function GET(request: NextRequest) {
  try {
    try {
      await doIt();
    } catch (ee) {
      console.error(ee);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30'); // 默认每页30条
    const offset = (page - 1) * limit;

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where: { status: 'published', albumId: albumId },
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
          description: true,
          album: {
            select: {
              id: true,
              name: true,
            }
          },
        },
      }),
      prisma.episode.count({
        where: { status: 'published', albumId: albumId },
      }),
    ]);

    // 将 episodes 平铺映射为 data 列表，并将 description 作为 group 属性
    const data = episodes.map(e => {
      let groupName = e.description || '';

      // 兼容原先的 CBS / MSN 判断逻辑（如果 blobUrl 包含特定标识）
      if (e.blobUrl && e.blobUrl.toLowerCase().indexOf('cbs') > -1) {
        groupName = 'CBS ' + groupName;
      } else if (e.blobUrl && e.blobUrl.toLowerCase().indexOf('msn') > -1) {
        groupName = 'MSN ' + groupName;
      }

      return {
        id: e.id,
        title: e.createdAt.toISOString().split('T')[0] + ' ' + e.title,
        url: e.blobUrl,
        img: "",
        group: groupName, // 将 description（或分类名称）作为 group
        date: e.createdAt,
        duration: e.duration,
        format: e.format,
      };
    });

    const responsePayload = {
      id: 100,
      channel: "News",
      clean: 1,
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit),
      data: data,
      sync: 1
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error fetching published episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published episodes' },
      { status: 500 }
    );
  }
}