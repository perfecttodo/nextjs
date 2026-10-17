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
    const real = process.env.HK_AIR+targetUrl;
    try {
      console.log()
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
        // 你可以依需求自訂 User-Agent 或其他標頭
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NextJS-CORS-Proxy',
      },
    });

    const data = await response.arrayBuffer();

    // 取得遠端回應的 Content-Type，若沒有則預設為通用類型
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 回傳內容並加上 CORS 標頭
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*', // 允許所有來源跨域存取
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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