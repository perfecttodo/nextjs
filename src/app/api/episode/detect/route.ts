import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import { AudioFormatDetection, AudioFormat } from './types';

const AUDIO_FORMATS: Record<string, string[]> = {
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/x-wav'],
  ogg: ['audio/ogg', 'application/ogg'],
  flac: ['audio/flac'],
  aac: ['audio/aac', 'audio/aacp'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  webm: ['audio/webm'],
  opus: ['audio/opus'],
  m3u8: ['application/vnd.apple.mpegurl', 'application/x-mpegurl']
};

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

function detectAudioFormat(url: string): Promise<AudioFormatDetection> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (response) => {
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];

      // Check for M3U8 format
      const isM3U8 = url.toLowerCase().endsWith('.m3u8') ||
        contentType?.includes('mpegurl') ||
        contentType?.includes('application/vnd.apple.mpegurl');

      if (isM3U8) {
        response.destroy();
        return resolve({
          url,
          format: 'm3u8',
          mimeType: contentType || null,
          contentLength: contentLength ? parseInt(contentLength) : null,
          isStream: true,
          success: true
        });
      }

      let detectedFormat: AudioFormat = 'unknown';
      let mimeType: string | null = null;

      if (contentType) {
        mimeType = Array.isArray(contentType) ? contentType[0] : contentType;

        // Check each audio format for matching MIME type
        for (const [format, mimeTypes] of Object.entries(AUDIO_FORMATS)) {
          if (mimeTypes.some(mime => mimeType?.includes(mime))) {
            detectedFormat = format as AudioFormat;
            break;
          }
        }

        // Fallback: check file extension if MIME type is generic
        if (detectedFormat === 'unknown') {
          const extension = url.split('.').pop()?.toLowerCase();
          if (extension && extension in AUDIO_FORMATS) {
            detectedFormat = extension as AudioFormat;
          }
        }
      }

      response.destroy();

      resolve({
        url,
        format: detectedFormat,
        mimeType,
        contentLength: contentLength ? parseInt(contentLength) : null,
        isStream: false,
        success: true
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}