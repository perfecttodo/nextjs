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
    const title: string = body?.title || 'hls_recording';
    const files: PresignFile[] = Array.isArray(body?.files) ? body.files : [];

    if (!files.length) {
      return NextResponse.json({ error: 'files are required' }, { status: 400 });
    }

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

    return NextResponse.json({
      baseFolder,
      files: results,
      playlistPublicUrl: playlist?.publicUrl || null
    });
  } catch (error) {
    console.error('Error generating HLS presigned URLs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


