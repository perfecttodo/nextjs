// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. 排除根目錄 '/'
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 2. 放行所有 /api 路由（保護 WebDAV）
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. 放行帶有副檔名的靜態檔案（如 .html, .js, .css, .png）
  const lastSegment = pathname.split('/').pop() || '';
  if (lastSegment.includes('.')) {
    return NextResponse.next();
  }

  // 4. 若網址末尾沒有斜杠，使用標準 URL 字串拼接強制補上斜杠（保留 ?page=1 等參數）
  if (!pathname.endsWith('/')) {
    const targetUrl = new URL(`${pathname}/${search}`, request.url);
    return NextResponse.redirect(targetUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
