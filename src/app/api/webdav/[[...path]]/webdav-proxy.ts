// src/app/api/webdav/[[...path]]/webdav-proxy.ts
import { v2 as webdav } from 'webdav-server';
import http from 'http';
import fs from 'fs';

const DATA_DIR = '/opt/WD/www/webdav';

// 確保目錄存在
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('無法建立 WebDAV 目錄:', e);
  }
}

// 儲存內部 WebDAV 伺服器的監聽埠號
let internalPort: number | null = null;
let startPromise: Promise<number> | null = null;

function getWebDAVServerPort(): Promise<number> {
  if (internalPort) return Promise.resolve(internalPort);
  if (startPromise) return startPromise;

  startPromise = new Promise((resolve, reject) => {
    const userManager = new webdav.SimpleUserManager();
    userManager.addUser('admin@example.com', 'admin123', true);

    const physicalFileSystem = new webdav.PhysicalFileSystem(DATA_DIR);
    const server = new webdav.WebDAVServer({
      rootFileSystem: physicalFileSystem,
      httpAuthentication: new webdav.HTTPBasicAuthentication(userManager, 'Default realm'),
    });

    // 讓 webdav-server 自己建立原生 Node HTTP Server 並監聽隨機本機埠
    const httpServer = http.createServer((req, res) => {
      server.executeRequest(req, res);
    });

    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      if (address && typeof address === 'object') {
        internalPort = address.port;
        console.log(`[WebDAV] 內部原生服務已啟動於 127.0.0.1:${internalPort}`);
        resolve(internalPort);
      } else {
        reject(new Error('無法取得 WebDAV 內部監聽埠'));
      }
    });

    httpServer.on('error', reject);
  });

  return startPromise;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // 可依需求改為動態 origin
  'Access-Control-Allow-Methods':
    'GET, HEAD, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Depth, Destination, If-Match, Lock-Token, Overwrite, Timeout',
  'Access-Control-Allow-Credentials': 'true',
};

export async function handleWebDAV(request: Request): Promise<Response> {
  // 1. 處理 CORS 預檢請求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const port = await getWebDAVServerPort();

    // 2. 計算轉發路徑（移除 /api/webdav 前綴）
    const url = new URL(request.url);
    let cleanPath = url.pathname.replace(/^\/api\/webdav/, '');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    const targetPath = cleanPath + url.search;

    // 3. 複製並修正轉發標頭（Destination 標頭也需移除 /api/webdav 前綴以支援 MOVE/COPY）
    const forwardHeaders: Record<string, string | string[]> = {};
    request.headers.forEach((value, key) => {
      forwardHeaders[key] = value;
    });
    if (typeof forwardHeaders.destination === 'string') {
      forwardHeaders.destination = forwardHeaders.destination.replace('/api/webdav', '');
    }
    // 移除 host，避免內部伺服器收到錯誤的 host 標頭
    delete forwardHeaders.host;
    delete forwardHeaders['content-length'];

    // 4. 使用 Node 原生 http.request 串流轉發給內部 WebDAV 伺服器
    return await new Promise<Response>((resolve) => {
      const proxyReq = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: targetPath,
          method: request.method,
          headers: forwardHeaders,
        },
        (proxyRes) => {
          console.log(
            `[WebDAV] ${request.method} ${targetPath} -> Status: ${proxyRes.statusCode}`
          );

          // 將 Node 的 headers 轉為 Web Headers
          const responseHeaders = new Headers();
          Object.entries(proxyRes.headers).forEach(([key, value]) => {
            if (value === undefined) return;
            if (Array.isArray(value)) {
              value.forEach((v) => responseHeaders.append(key, v));
            } else {
              responseHeaders.set(key, value);
            }
          });
          // 補上 CORS 標頭
          Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            responseHeaders.set(key, value);
          });

          // 使用 ReadableStream 串流回應，避免大檔案佔用記憶體
          const stream = new ReadableStream({
            start(controller) {
              proxyRes.on('data', (chunk: Buffer) => {
                controller.enqueue(new Uint8Array(chunk));
              });
              proxyRes.on('end', () => {
                controller.close();
              });
              proxyRes.on('error', (err) => {
                controller.error(err);
              });
            },
            cancel() {
              proxyRes.destroy();
            },
          });

          resolve(
            new Response(stream, {
              status: proxyRes.statusCode || 200,
              headers: responseHeaders,
            })
          );
        }
      );

      proxyReq.on('error', (err) => {
        console.error('[WebDAV Proxy Error]:', err);
        resolve(new Response('Bad Gateway', { status: 502, headers: CORS_HEADERS }));
      });

      // 將 Request body 串流導向內部伺服器
      if (request.body) {
        const reader = request.body.getReader();
        const pump = async (): Promise<void> => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              proxyReq.end();
              return;
            }
            proxyReq.write(value);
            await pump();
          } catch (err) {
            console.error('[WebDAV Body Pump Error]:', err);
            proxyReq.destroy();
          }
        };
        pump();
      } else {
        proxyReq.end();
      }
    });
  } catch (err) {
    console.error('[WebDAV Error]:', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}