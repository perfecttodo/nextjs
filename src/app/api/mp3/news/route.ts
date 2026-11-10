import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { doIt } from '@/app/api/episode/bot-sync';
const albumId = process.env.BOT_ALBUM_ID;

export async function GET(request: NextRequest) {
  try {
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
        group: groupName,
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

    // --- 1. 创建常规的 NextResponse ---
    const response = NextResponse.json(responsePayload);

    // --- 2. 设置缓存控制响应头 ---
    // 解释：
    // - public: 浏览器和公共 CDN 都可以缓存
    // - max-age=60: 浏览器本地缓存 60 秒
    // - s-maxage=300: CDN/代理服务器缓存 300 秒（5分钟）
    // - stale-while-revalidate=600: 如果内容过期，在接下来 10 分钟内可以先返回旧缓存，同时在后台悄悄请求新数据更新
    response.headers.set(
      'Cache-Control',
      'public, max-age=36000, s-maxage=300, stale-while-revalidate=600'
    );

    return response;

  } catch (error) {
    console.error('Error fetching published episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published episodes' },
      { status: 500 }
    );
  }
}