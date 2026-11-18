// src/app/api/webdav/[[...path]]/route.ts
import { handleWebDAV } from './webdav-proxy';

// 必須關閉 Next.js 的 body 解析，讓 WebDAV 自行處理串流
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handleWebDAV;
export const HEAD = handleWebDAV;
export const POST = handleWebDAV;
export const PUT = handleWebDAV;
export const DELETE = handleWebDAV;
export const PATCH = handleWebDAV;
export const OPTIONS = handleWebDAV;