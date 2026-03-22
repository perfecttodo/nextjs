import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { detectAudioFormat, getMimeTypeFromUrl, fetchJson } from '@/slib/server';

const jsonUrl = process.env.BOT_NEW_JSON_URL;
const onwerId = process.env.BOT_OWNER_ID;
const albumId = process.env.BOT_ALBUM_ID;


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
  }else   if(jsonUrl.indexOf(".cbs")>-1){

    return data.items.map((e: any) => {
      const url = e.video||e.video2;
      const fileSize =0;
      const duration = e.duration;
  
      return {
        title: e.fulltitle,
        url,
        fileSize,
        duration,
        format: e.format,
        timestamp:e.timestamp
      }
    });
  }


}
export async function GET(request: NextRequest) {

      if (!jsonUrl || !onwerId || !albumId) {
      console.error(jsonUrl, onwerId, albumId);
      return NextResponse.json({ error: 'Missing required environment variables' }, { status: 500 });
    }

  try {



    await doIt();


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

export async function doIt() {
  if(jsonUrl)
  for (let url of jsonUrl.split(',')) {

    const items = await getItems(url);;
    console.log('Fetched items:', items.length);

    for (let i = 0; i < items.length; i++) {
      let e = items[i];

      const status = 'published';
      let format = e?.format || getMimeTypeFromUrl(e.url);
      if (!format) {
        const detectFormat = await detectAudioFormat(e.url);
        format = detectFormat.format;

      }


      // Save to database
      try {

        const [episodes] = await Promise.all([
          prisma.episode.findMany({
            where: {
              status: 'published',
              albumId: albumId,
              blobUrl: e.url
            },
            select: {
              id: true
              // Add other fields you want to select here
            }
          })
        ]);

        if (episodes.length == 0) {


          const episode = await prisma.episode.create({
            data: {
              title: e.title.trim(),
              originalName: e.title.trim(),
              blobUrl: e.url,
              format,
              fileSize: e.fileSize,
              status,
              ownerId: onwerId||'',
              description: null,
              language: null,
              originalWebsite: null,
              duration: typeof e.duration === 'string' ? parseInt(e.duration) : e.duration,
              albumId: albumId || null,
              createdAt: new Date(e.timestamp)
            }
          });
          console.log(episode.id, episode.title, episode.createdAt);

        }

      } catch (err) {
        console.log('err', err);
      }


    }
  }
}
