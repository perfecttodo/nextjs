import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { detectAudioFormat, getMimeTypeFromUrl, fetchJson } from '@/slib/server';

const jsonUrl = process.env.BOT_NEW_JSON_URL;
const onwerId = process.env.BOT_OWNER_ID;
const albumId = process.env.BOT_ALBUM_ID;

// Rate limiting variables
let lastExecutionTime: number | null = null;
const RATE_LIMIT_MS =60 * 60 * 1000; // 10 minutes in milliseconds

function getFirst(e: { externalVideoFiles: { url: string; fileSize?: number }[] }) {
  return e.externalVideoFiles.sort((a, b) => {
    if (a.url.endsWith('.m3u8')) return -1; // Move .m3u8 to the front
    if (b.url.endsWith('.m3u8')) return 1;  // Keep others in their original order
    return 0; // No change for other elements
  })[0]
}

async function getItems(jsonUrl: string) {
  const data = await fetchJson(jsonUrl);

  if(jsonUrl.indexOf(".msn")>-1){
    return data.subCards.map((e: any) => {
      let file = getFirst(e);
      const url = file.url;
      const fileSize = file.fileSize || 0;
      const duration = e.videoMetadata.playTime;
      return {
        title: e.title,
        url,
        fileSize,
        duration,
        timestamp:new Date(e.publishedDateTime).getTime()
      }
    });
  } else if(jsonUrl.indexOf(".cbs")>-1){
    return data.items.map((e: any) => {
      const url = e.video||e.video2;
      const fileSize = 0;
      const duration = e.duration;
      return {
        title: e.fulltitle,
        url,
        fileSize,
        duration,
        format: e.format,
        timestamp:e.timestamp,
        channel:data.title
      }
    });
  }
}

// Remove 'export' from this line
export async function doIt() {
  // Check rate limit
  const now = Date.now();
  if (lastExecutionTime && (now - lastExecutionTime) < RATE_LIMIT_MS) {
    const remainingTime = Math.ceil((RATE_LIMIT_MS - (now - lastExecutionTime)) / 1000);
    const message = `Rate limited. Please wait ${remainingTime} seconds before calling again.`;
    console.log(message);
    return { success: false, error: message, remainingSeconds: remainingTime };
  }

  // Update last execution time
  lastExecutionTime = now;
  console.log(`Starting doIt execution at ${new Date(now).toISOString()}`);

  try {
    if (jsonUrl) {
      for (let url of jsonUrl.split(',')) {
        console.log(`Processing URL: ${url}`);
        const items = await getItems(url);
        console.log('Fetched items:', items.length);

        for (let i = 0; i < items.length; i++) {
          let e = items[i];
          if(!e.url)continue;
          
          const status = 'published';
          let format = e?.format || getMimeTypeFromUrl(e.url);
          if (!format) {
            const detectFormat = await detectAudioFormat(e.url);
            format = detectFormat.format;
          }

          // Save to database
          try {
            const episodes = await prisma.episode.findMany({
              where: {
                status: 'published',
                albumId: albumId,
                blobUrl: e.url
              },
              select: {
                id: true
              }
            });

            if (episodes.length == 0) {
              const episode = await prisma.episode.create({
                data: {
                  title: e.title.trim(),
                  originalName: e.title.trim(),
                  blobUrl: e.url,
                  format,
                  fileSize: e.fileSize,
                  status,
                  ownerId: onwerId || '',
                  description: e.channel,
                  language: null,
                  originalWebsite: null,
                  duration: typeof e.duration === 'string' ? parseInt(e.duration) : e.duration,
                  albumId: albumId || null,
                  createdAt: new Date(e.timestamp)
                }
              });
              console.log(`Created episode: ${episode.id} - ${episode.title}`);
            } else {
              console.log(`Episode already exists: ${e.url}`);
            }
          } catch (err) {
            console.error('Error saving episode:', err);
            console.error('Failed episode data:', e);
          }
        }
      }
    }
    
    console.log(`Completed doIt execution at ${new Date().toISOString()}`);
    return { success: true, message: 'Successfully processed all items' };
  } catch (error) {
    console.error('Error in doIt:', error);
    return { success: false, error: String(error) };
  }
}