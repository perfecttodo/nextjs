import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { detectAudioFormat,getMimeTypeFromUrl,fetchJson } from '@/slib/server';

const jsonUrl = process.env.BOT_NEW_JSON_URL;
const onwerId = process.env.BOT_OWNER_ID;
const albumId = process.env.BOT_ALBUM_ID;


function getFirst(e: { externalVideoFiles: { url: string; fileSize?: number }[] }) {
  return e.externalVideoFiles.sort((a, b) => {
    if (a.url.endsWith( '.mp4')) return -1; // Move .m3u8 to the front
    if (b.url.endsWith( '.mp4')) return 1;  // Keep others in their original order
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
      let format = getMimeTypeFromUrl(url);
      if(!format){
        const detectFormat = await detectAudioFormat(url);
        format= detectFormat.format;
       
      }

      const duration =  e.videoMetadata.playTime;

      // Save to database
      try{
        const episode = await prisma.episode.create({
          data: {
            title: e.title.trim(),
            originalName: e.title.trim(),
            blobUrl: url,
            format,
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