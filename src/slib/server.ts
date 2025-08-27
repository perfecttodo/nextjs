import https from 'https';
import http from 'http';
import * as mime from 'mime-types';

import { AudioFormatDetection, AudioFormat } from '@/slib/types';

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

export function detectAudioFormat(url: string): Promise<AudioFormatDetection> {
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
            mimeType: contentType || '',
            contentLength: contentLength ? parseInt(contentLength) : null,
            isStream: true,
            success: true
          });
        }
  
        let detectedFormat: AudioFormat = 'unknown';
        let mimeType: string | '' = '';
  
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


export function getMimeTypeFromUrl(url: string): string {
    // Extract the file extension from the URL
    const extension = url.split('.').pop()?.toLowerCase();

    // Get the MIME type using the mime package
    const mimeType = extension ? mime.lookup(extension) : null;

    // Return the MIME type or a default value if not found
    return mimeType || '';
}



import axios from 'axios';
export async function fetchJson(url: string): Promise<any> {
  try {
    console.log('Fetching URL:', url);
    const response = await axios.get(url);
    return response.data; // Automatically parses JSON
  } catch (error) {
    throw new Error('Error fetching URL: ' + (error as Error).message);
  }
}

/*import https from 'https';
import http from 'http';
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('Fetching URL:', url);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          console.log(data)

          const jsonData = JSON.parse(data); // Parse the JSON data
          resolve(jsonData); // Resolve the promise with parsed JSON
        } catch (error) {
          reject('Error parsing JSON: ' + error); // Reject if JSON parsing fails
        }
      });
    }).on('error', (error) => {
      reject('Error fetching URL: ' + error); // Reject on request error
    });
  });
}*/