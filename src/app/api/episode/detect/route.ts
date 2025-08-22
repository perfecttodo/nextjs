import { NextRequest, NextResponse } from 'next/server';


import { detectAudioFormat } from '@/slib/server'

export async function GET(
  request: NextRequest
) {

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const result = await detectAudioFormat(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to detect audio format',
      details: (error as Error).message,
    }, { status: 500 });
  }
}

