import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 嚴格的安全路徑檢查函數
function getTargetDirectory(dirParam: string | null): string {
  const allowedBaseDir = path.resolve('/opt/WD/www/mp3');

  if (!dirParam || dirParam.trim() === '') {
    return allowedBaseDir;
  }

  let targetPath: string;
  if (path.isAbsolute(dirParam) || dirParam.startsWith('/')) {
    targetPath = path.resolve(dirParam);
  } else {
    targetPath = path.resolve(allowedBaseDir, dirParam);
  }

  const normalizedPath = path.normalize(targetPath);
  
  if (!normalizedPath.startsWith(allowedBaseDir) || !normalizedPath.includes('/mp3')) {
    throw new Error('存取路徑不合法：只允許存取包含 /mp3/ 的指定目錄');
  }

  const relative = path.relative(allowedBaseDir, normalizedPath);
  if (relative.startsWith('..') && normalizedPath !== allowedBaseDir) {
    throw new Error('存取路徑不合法：禁止跨越基礎目錄');
  }

  return normalizedPath;
}

// 支援的音訊副檔名
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];

// 遞迴獲取目錄下所有音訊檔案的輔助函數
function getAllAudioFiles(dir: string, baseDir: string, fileList: any[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      getAllAudioFiles(fullPath, baseDir, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        
        let category = '未分類';
        let displayName = entry.name;
        
        const match = entry.name.match(/^\[(.+?)\]\s*(.+)$/);
        if (match) {
          category = match[1];
          displayName = match[2];
        }

        fileList.push({
          filename: entry.name,
          relativePath: relativePath,
          displayName: displayName,
          category: category,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
  }
  return fileList;
}

// GET: 取得指定 dir 的音訊列表（含子目錄遞迴），或串流播放指定檔案
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirParam = searchParams.get('dir');
    const action = searchParams.get('action');
    const filename = searchParams.get('filename');

    const targetDir = getTargetDirectory(dirParam);

    if (action === 'stream' && filename) {
      const filePath = path.resolve(targetDir, filename);
      
      console.log(`[Stream Debug] targetDir: ${targetDir}, filename: ${filename}, resolved filePath: ${filePath}`);

      if (!filePath.startsWith(targetDir) || !fs.existsSync(filePath)) {
        return NextResponse.json({ error: `檔案不存在或不合法 (Path: ${filePath})` }, { status: 404 });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = request.headers.get('range');

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'audio/mpeg';
      if (ext === '.flac') contentType = 'audio/flac';
      else if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.m4a') contentType = 'audio/mp4';

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
            'Content-Type': contentType,
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
            'Content-Type': contentType,
          },
        });
      }
    }

    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ success: false, error: `目標資料夾不存在: ${targetDir}` }, { status: 404 });
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const subdirectories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    const files = getAllAudioFiles(targetDir, targetDir);

    const categoriesSet = new Set(['未分類', '流行', '輕音樂', '工作', '其他']);
    files.forEach(f => {
      if (f.category !== '未分類') categoriesSet.add(f.category);
    });

    return NextResponse.json({
      success: true,
      currentDir: dirParam || '',
      subdirectories,
      categories: Array.from(categoriesSet),
      files,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: 刪除指定的音訊檔案
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirParam = searchParams.get('dir');
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, error: '未提供檔案名稱' }, { status: 400 });
    }

    const targetDir = getTargetDirectory(dirParam);
    const filePath = path.resolve(targetDir, filename);

    if (!filePath.startsWith(targetDir) || !fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: '檔案不存在或路徑不合法' }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: 更新檔案分類（透過檔名前綴或額外邏輯儲存，這裡示範重新命名加上中括號標籤）
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { dir, filename, newCategory } = body;

    if (!filename || !newCategory) {
      return NextResponse.json({ success: false, error: '參數不完整' }, { status: 400 });
    }

    const targetDir = getTargetDirectory(dir);
    const filePath = path.resolve(targetDir, filename);

    if (!filePath.startsWith(targetDir) || !fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: '檔案不存在或路徑不合法' }, { status: 404 });
    }

    const parsedPath = path.parse(filename);
    let pureName = parsedPath.name;
    
    // 移除舊的分類標籤前綴（如 [流行] ）
    pureName = pureName.replace(/^\[.+?\]\s*/, '');
    
    const newBaseName = `[${newCategory}] ${pureName}${parsedPath.ext}`;
    const dirName = path.dirname(filename);
    const newRelativePath = dirName === '.' ? newBaseName : path.join(dirName, newBaseName);
    const newFilePath = path.resolve(targetDir, newRelativePath);

    fs.renameSync(filePath, newFilePath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}