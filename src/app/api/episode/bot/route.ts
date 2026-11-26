import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { detectAudioFormat, getMimeTypeFromUrl, fetchJson } from '@/slib/server';
import {doIt} from '../bot-sync';

const jsonUrl = process.env.BOT_NEW_JSON_URL;
const onwerId = process.env.BOT_OWNER_ID;
const albumId = process.env.BOT_ALBUM_ID;


export async function GET(request: NextRequest) {
  // Check if required environment variables are set
  if (!jsonUrl || !onwerId || !albumId) {
    console.error('Missing environment variables:', { jsonUrl, onwerId, albumId });
    return NextResponse.json({ error: 'Missing required environment variables' }, { status: 500 });
  }

  try {
    const result = await doIt();
    
    if (!result.success) {
      // Return 429 Too Many Requests if rate limited
      const statusCode = result.remainingSeconds ? 429 : 500;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to process audio URL' },
      { status: 500 }
    );
  }
}