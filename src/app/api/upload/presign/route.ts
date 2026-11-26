import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generatePresignedUploadUrl } from '@/lib/r2';

type PresignFile = {
  name: string;
  contentType?: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const filename: string | undefined = body?.filename;
    const contentType: string | undefined = body?.contentType;
    const files: PresignFile[] = Array.isArray(body?.files) ? body.files : [];
    const title: string = body?.title || 'upload';

    // Batch mode (HLS or multi-file uploads)
    if (files.length > 0) {
      const timestamp = Date.now();
      const safeTitle = String(title).replace(/\s+/g, '_');
      const baseFolder = `${user.sub}/${timestamp}-${safeTitle}`;

      const results: Array<{ name: string; key: string; uploadUrl: string; publicUrl: string }> = [];
      for (const file of files) {
        const key = `${baseFolder}/${file.name}`;
        const presign = await generatePresignedUploadUrl(key, file.contentType);
        if (!presign?.signedUrl) {
          return NextResponse.json({ error: `Failed to generate presigned URL for ${file.name}` }, { status: 500 });
        }
        const publicUrl = `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`;
        results.push({ name: file.name, key, uploadUrl: presign.signedUrl, publicUrl });
      }

      const playlist = results.find(r => r.name === 'playlist.m3u8');
      return NextResponse.json({ baseFolder, files: results, playlistPublicUrl: playlist?.publicUrl || null });
    }

    // Single-file mode
    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = String(filename).replace(/\s+/g, '_');
    const key = `${user.sub}/${timestamp}-${safeName}`;
    const result = await generatePresignedUploadUrl(key, contentType);
    if (!result?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
    }
    const publicUrl = `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`;
    return NextResponse.json({ key, uploadUrl: result.signedUrl, publicUrl });
  } catch (error) {
    console.error('Error generating presigned URL(s):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


