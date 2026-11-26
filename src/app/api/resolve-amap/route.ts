// app/api/resolve-amap/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ★ 关键安全配置：SSRF 防护白名单
const ALLOWED_HOSTS = new Set(['surl.amap.com']);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shortUrl = searchParams.get('url');

  // 1. 基础校验
  if (!shortUrl) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  // 2. SSRF 防护：严格校验协议和主机名
  try {
    const parsedUrl = new URL(shortUrl);
    if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return NextResponse.json({ error: '非法或不被允许的短链接地址' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: '无效的 URL 格式' }, { status: 400 });
  }

  // 3. 请求短链接，并设置 redirect: 'manual' 以手动处理重定向
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual', // 关键：告诉 fetch 不要自动跟随重定向
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HKTaxiHelper/1.0)', // 伪装成正常浏览器
      },
      // 设置超时，防止请求挂起
      signal: AbortSignal.timeout(5000),
    });

    // 4. 高德短链接通常返回 302，重定向目标在 Location 头部
    const location = response.headers.get('location');

    if (location) {
      // 返回 CORS 友好的 JSON 响应
      return NextResponse.json({ finalUrl: location });
    } else {
      // 有些情况可能直接返回 200，但内容不是我们想要的，或没有 Location
      return NextResponse.json(
        { error: '未在响应中找到重定向地址 (Location header)' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('解析短链接失败:', error);
    // 处理超时或网络错误
    return NextResponse.json(
      { error: `解析失败: ${error.message || '网络请求错误'}` },
      { status: 500 }
    );
  }
}