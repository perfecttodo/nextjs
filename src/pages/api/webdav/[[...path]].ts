import { v2 as webdav } from 'webdav-server';
import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 處理 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, HEAD, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Depth, Destination, If-Match, Lock-Token, Overwrite, Timeout'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const port = await getWebDAVServerPort();

    // 2. 計算轉發路徑（移除 /api/webdav 前綴）
    const rawUrl = req.url || '/';
    const [pathname, search] = rawUrl.split('?');
    let cleanPath = pathname.replace(/^\/api\/webdav/, '');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    const targetPath = search ? `${cleanPath}?${search}` : cleanPath;

    // 3. 複製並修正轉發標頭（若有 Destination 標頭，也需移除 /api/webdav 前綴以支援 MOVE/COPY）
    const forwardHeaders = { ...req.headers };
    if (typeof forwardHeaders.destination === 'string') {
      forwardHeaders.destination = forwardHeaders.destination.replace('/api/webdav', '');
    }

    // 4. 使用 Node 原生 http.request 串流轉發給內部 WebDAV 伺服器
    const proxyReq = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: targetPath,
        method: req.method,
        headers: forwardHeaders,
      },
      (proxyRes) => {
        console.log(`[WebDAV] ${req.method} ${targetPath} -> Status: ${proxyRes.statusCode}`);
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('[WebDAV Proxy Error]:', err);
      if (!res.headersSent) {
        res.status(502).send('Bad Gateway');
      }
    });

    // 將客戶端請求串流直接導向內部伺服器
    req.pipe(proxyReq);
  } catch (err) {
    console.error('[WebDAV Error]:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}
