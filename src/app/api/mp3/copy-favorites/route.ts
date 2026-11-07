import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface CopyFavoritesRequest {
    sourceDir?: string;
    targetDir?: string;
    filenames?: string[];
}

export async function POST(request: NextRequest) {
    try {
        const body: CopyFavoritesRequest = await request.json();
        const { sourceDir, targetDir, filenames } = body;

        // 1. 驗證基本參數
        if (!targetDir || !filenames || !Array.isArray(filenames) || filenames.length === 0) {
            return NextResponse.json(
                { success: false, error: '缺少必要的參數 (targetDir 或 filenames)' },
                { status: 400 }
            );
        }

        if (!sourceDir) {
            return NextResponse.json(
                { success: false, error: '未指定來源資料夾路徑 (sourceDir)' },
                { status: 400 }
            );
        }

        // 2. 確保目標目錄存在，若不存在則遞迴建立
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (err: any) {
                return NextResponse.json(
                    { success: false, error: `無法建立目標資料夾: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // 3. 迴圈處理檔案（轉碼或複製）
        for (const fileKey of filenames) {
            try {
                let srcFilePath = fileKey;
                if (!path.isAbsolute(fileKey)) {
                    srcFilePath = path.join(sourceDir, fileKey);
                }

                if (!fs.existsSync(srcFilePath)) {
                    failCount++;
                    errors.push(`找不到來源檔案: ${srcFilePath}`);
                    continue;
                }

                const originalExt = path.extname(srcFilePath).toLowerCase();
                const baseName = path.basename(srcFilePath, originalExt);
                
                // 決定目標檔案名稱與路徑
                // 如果原本就是 .mp3，可以直接複製；若不是，副檔名改為 .mp3
                const isMp3 = originalExt === '.mp3';
                const targetExt = isMp3 ? originalExt : '.mp3';
                const destFileName = `${baseName}${targetExt}`;
                const destFilePath = path.join(targetDir, destFileName);

                if (isMp3) {
                    // 如果本身就是 mp3，直接用複製即可
                    fs.copyFileSync(srcFilePath, destFilePath);
                } else {
                    // 如果不是 mp3，使用 ffmpeg 進行轉碼
                    // -y 參數代表如果目標檔案已存在則直接覆蓋
                    // 常用設定: -codec:a libmp3lame -qscale:a 2 (高品質變動位元率 VBR) 或 -b:a 192k (固定位元率)
                    const ffmpegCommand = `ffmpeg -y -i "${srcFilePath}" -codec:a libmp3lame -b:a 192k "${destFilePath}"`;
                    
                    await execPromise(ffmpegCommand);
                }

                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push(`檔案 ${fileKey} 處理失敗: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err: any) {
        console.error('Copy/Convert favorites API error:', err);
        return NextResponse.json(
            { success: false, error: err.message || '伺服器內部錯誤' },
            { status: 500 }
        );
    }
}