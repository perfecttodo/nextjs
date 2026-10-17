import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    // 檢查是否有傳入 target url
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing "url" query parameter' },
        { status: 400 }
      );
    }

    // 驗證 URL 格式
    const real = process.env.HK_AIR + targetUrl;
    try {
      new URL(real);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 抓取遠端目標內容
    const response = await fetch(real, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NextJS-CORS-Proxy',
      },
      // 提示：你也可以在這裡加上 Next.js 的 fetch 快取設定，例如：
      // next: { revalidate: 3600 }
    });

    const data = await response.arrayBuffer();

    // 取得遠端回應的 Content-Type，若沒有則預設為通用類型
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 回傳內容並加上 CORS 與 Cache-Control 標頭
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*', // 允許所有來源跨域存取
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // 設定快取：公共快取 1 小時 (3600秒)
        // stale-while-revalidate 允許在背景更新快取時先提供舊資料，提升效能
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('CORS Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the target URL' },
      { status: 500 }
    );
  }
}

// 處理 OPTIONS 預檢請求 (Preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}