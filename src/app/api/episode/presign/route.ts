import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType } = await request.json();
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

    return NextResponse.json({
      key,
      uploadUrl: result.signedUrl,
      publicUrl
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


