import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 嚴格的安全路徑檢查函數
function getTargetDirectory(dirParam: string | null): string {
  // 定義系統允許的絕對根目錄（可根據您的環境調整，必須包含 /mp3/）
  const allowedBaseDir = path.resolve('/opt/WD/www/mp3');

  // 如果未傳入參數，預設返回允許的根目錄
  if (!dirParam || dirParam.trim() === '') {
    return allowedBaseDir;
  }

  let targetPath: string;

  // 判斷是絕對路徑還是相對路徑
  if (path.isAbsolute(dirParam) || dirParam.startsWith('/')) {
    targetPath = path.resolve(dirParam);
  } else {
    targetPath = path.resolve(allowedBaseDir, dirParam);
  }

  // 【安全檢查 1】：絕對必須包含 "/mp3/" 目錄結構
  // 透過標準化路徑並確保分隔符號一致
  const normalizedPath = path.normalize(targetPath);
  
  // 檢查路徑中是否確實包含 "/mp3/" 區段
  // 為了安全，我們也可以強制要求必須以 allowedBaseDir 開頭
  if (!normalizedPath.startsWith(allowedBaseDir) || !normalizedPath.includes('/mp3/')) {
    throw new Error('存取路徑不合法：只允許存取包含 /mp3/ 的指定目錄');
  }

  // 【安全檢查 2】：額外防範 Path Traversal（例如使用多個 ../ 繞過）
  const relative = path.relative(allowedBaseDir, normalizedPath);
  if (relative.startsWith('..') && normalizedPath !== allowedBaseDir) {
    throw new Error('存取路徑不合法：禁止跨越基礎目錄');
  }

  return normalizedPath;
}

// GET: 取得指定 dir 的 MP3 列表，或串流播放指定檔案
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirParam = searchParams.get('dir');
    const action = searchParams.get('action');
    const filename = searchParams.get('filename');

    const targetDir = getTargetDirectory(dirParam);

    // 如果是請求串流播放檔案
    if (action === 'stream' && filename) {
      const filePath = path.join(targetDir, filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = request.headers.get('range');

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        const stream = new ReadableStream({
          start(controller) {
            file.on('data', chunk => controller.enqueue(chunk));
            file.on('end', () => controller.close());
            file.on('error', err => controller.error(err));
          }
        });

        return new Response(stream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': 'audio/mpeg',
          },
        });
      } else {
        const file = fs.createReadStream(filePath);
        const stream = new ReadableStream({
          start(controller) {
            file.on('data', chunk => controller.enqueue(chunk));
            file.on('end', () => controller.close());
            file.on('error', err => controller.error(err));
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': 'audio/mpeg',
          },
        });
      }
    }

    // 一般 GET: 列出資料夾中的 MP3 檔案
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ success: false, error: `目標資料夾不存在: ${targetDir}` }, { status: 404 });
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const files = [];
    const categoriesSet = new Set(['未分類', '流行', '輕音樂', '工作', '其他']);

    for (const entry of entries) {
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.mp3') {
        const filePath = path.join(targetDir, entry.name);
        const stats = fs.statSync(filePath);
        
        let category = '未分類';
        let displayName = entry.name;
        
        const match = entry.name.match(/^\[(.+?)\]\s*(.+)$/);
        if (match) {
          category = match[1];
          displayName = match[2];
          categoriesSet.add(category);
        }

        files.push({
          filename: entry.name,
          displayName: displayName,
          category: category,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }

    return NextResponse.json({
      success: true,
      currentDir: dirParam || '',
      categories: Array.from(categoriesSet),
      files,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: 刪除指定的 MP3 檔案
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirParam = searchParams.get('dir');
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, error: '未提供檔名' }, { status: 400 });
    }

    const targetDir = getTargetDirectory(dirParam);
    const filePath = path.join(targetDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: '檔案已刪除' });
    } else {
      return NextResponse.json({ success: false, error: '找不到該檔案' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: 修改 MP3 分類
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { dir = '', filename, newCategory } = body;

    if (!filename || !newCategory) {
      return NextResponse.json({ success: false, error: '參數不足' }, { status: 400 });
    }

    const targetDir = getTargetDirectory(dir);
    const oldFilePath = path.join(targetDir, filename);

    if (!fs.existsSync(oldFilePath)) {
      return NextResponse.json({ success: false, error: '找不到原始檔案' }, { status: 404 });
    }

    let cleanName = filename;
    const match = filename.match(/^\[(.+?)\]\s*(.+)$/);
    if (match) {
      cleanName = match[2];
    }

    const newFilename = `[${newCategory}] ${cleanName}`;
    const newFilePath = path.join(targetDir, newFilename);

    fs.renameSync(oldFilePath, newFilePath);

    return NextResponse.json({
      success: true,
      message: '分類修改成功',
      newFilename,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}