import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

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

        // 3. 迴圈複製檔案
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

                const fileName = path.basename(srcFilePath);
                const destFilePath = path.join(targetDir, fileName);

                fs.copyFileSync(srcFilePath, destFilePath);
                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push(`檔案 ${fileKey} 複製失敗: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err: any) {
        console.error('Copy favorites API error:', err);
        return NextResponse.json(
            { success: false, error: err.message || '伺服器內部錯誤' },
            { status: 500 }
        );
    }
}