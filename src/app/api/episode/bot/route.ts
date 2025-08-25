import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import https from 'https';
import http from 'http';


const jsonUrl = process.env.BOT_NEW_JSON_URL;
const onwerId = process.env.BOT_OWNER_ID;
const albumId = process.env.BOT_ALBUM_ID;
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
}

function getFirst(e: { externalVideoFiles: { url: string; fileSize?: number }[] }) {
  return e.externalVideoFiles.sort((a, b) => {
    if (a.url.endsWith( '.m3u8')) return -1; // Move .m3u8 to the front
    if (b.url.endsWith( '.m3u8')) return 1;  // Keep others in their original order
    return 0; // No change for other elements
  })[0]
}


export async function GET(request: NextRequest) {
  try {


    if (!jsonUrl || !onwerId||!albumId) {
      console.error(jsonUrl,onwerId,albumId);
      return NextResponse.json({ error: 'Missing required environment variables' }, { status: 500 });
    }

    const data = await fetchJson(jsonUrl);

    const itmes = data.subCards;

    for (let i = 0; i < itmes.length; i++) {
      let e = itmes[i];
      let file = getFirst(e);
      const url = file.url;
      const fileSize = file.fileSize || 0;
      const status = 'published';
      const duration = 0;
      // Save to database
      try{
        const episode = await prisma.episode.create({
          data: {
            title: e.title.trim(),
            originalName: e.title.trim(),
            blobUrl: url,
            blobId: `bot-${Date.now()}`, // Create a unique ID for URL-based files
            format: 'm3u8',
            fileSize,
            status,
            ownerId: onwerId,
            description: null,
            language: null,
            originalWebsite: null,
            duration: typeof duration === 'string' ? parseInt(duration) : duration,
            albumId: albumId || null,
          }
        });
      }catch(err){
        console.log('err',err)
      }
   

    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error processing audio URL:', error);
    return NextResponse.json(
      { error: 'Failed to process audio URL' },
      { status: 500 }
    );
  }
}