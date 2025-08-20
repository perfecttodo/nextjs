'use client';

import { useCallback, useRef, useState } from 'react';

const FFMPEG_CONFIG = {
  baseURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
  maxRetries: 3,
  retryDelay: 100,
} as const;

export type OutputFormat = 'm3u8' | 'mp3' | 'm4a';

export interface HlsFile {
  name: string;
  data: Uint8Array;
  type: string;
}

export interface UseFfmpegEngine {
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  error: string;
  loadFFmpeg: () => Promise<void>;
  processBlob: (inputBlob: Blob, format: OutputFormat) => Promise<Blob>;
  getM3U8Content: () => Promise<string>;
  checkFS: () => Promise<boolean>;
  collectHlsFiles: () => Promise<HlsFile[]>;
  cleanupFiles: () => Promise<void>;
}

export function useFfmpegEngine(): UseFfmpegEngine {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [error, setError] = useState('');
  const ffmpegRef = useRef<any>(null);

  const ensureM3U8EndTag = useCallback((data: Uint8Array): Uint8Array => {
    const text = new TextDecoder().decode(data);
    if (text.includes('#EXT-X-ENDLIST')) return data;
    const updatedText = text.trim() + '\n#EXT-X-ENDLIST';
    return new TextEncoder().encode(updatedText);
  }, []);

  const loadFFmpeg = useCallback(async () => {
    try {
      setFfmpegLoading(true);
      setError('');

      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();
      const baseURL = FFMPEG_CONFIG.baseURL;

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
    } catch (e) {
      console.error('Failed to load FFmpeg:', e);
      setError('Failed to load FFmpeg. Please refresh the page and try again.');
    } finally {
      setFfmpegLoading(false);
    }
  }, []);

  const processBlob = useCallback(async (inputBlob: Blob, format: OutputFormat): Promise<Blob> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;
    const inputData = await inputBlob.arrayBuffer();

    // Write input
    let retryCount = 0;
    while (retryCount < FFMPEG_CONFIG.maxRetries) {
      try {
        await ffmpeg.writeFile('input.webm', new Uint8Array(inputData));
        break;
      } catch (writeError) {
        retryCount++;
        if (retryCount >= FFMPEG_CONFIG.maxRetries) {
          throw new Error(`Failed to write input file after ${FFMPEG_CONFIG.maxRetries} attempts`);
        }
        await new Promise((resolve) => setTimeout(resolve, FFMPEG_CONFIG.retryDelay));
      }
    }

    let outputFileName: string;
    let ffmpegArgs: string[];

    switch (format) {
      case 'm3u8':
        outputFileName = 'output.m3u8';
        ffmpegArgs = [
          '-i', 'input.webm',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-hls_time', '2',
          '-hls_list_size', '0',
          '-hls_segment_filename', 'segment_%03d.ts',
          '-hls_playlist_type', 'vod',
          '-hls_flags', 'independent_segments',
          '-hls_segment_type', 'mpegts',
          outputFileName,
        ];
        break;
      case 'mp3':
        outputFileName = 'output.mp3';
        ffmpegArgs = ['-i', 'input.webm', '-c:a', 'mp3', '-b:a', '128k', outputFileName];
        break;
      case 'm4a':
        outputFileName = 'output.m4a';
        ffmpegArgs = ['-i', 'input.webm', '-c:a', 'aac', '-b:a', '128k', outputFileName];
        break;
      default:
        throw new Error('Unsupported output format');
    }

    // Exec
    retryCount = 0;
    while (retryCount < FFMPEG_CONFIG.maxRetries) {
      try {
        await ffmpeg.exec(ffmpegArgs);
        break;
      } catch (execError) {
        retryCount++;
        if (retryCount >= FFMPEG_CONFIG.maxRetries) {
          throw new Error(`Failed to process audio after ${FFMPEG_CONFIG.maxRetries} attempts`);
        }
        await new Promise((resolve) => setTimeout(resolve, FFMPEG_CONFIG.retryDelay * 2));
      }
    }

    // Read output
    retryCount = 0;
    let outputData: Uint8Array | undefined;
    while (retryCount < FFMPEG_CONFIG.maxRetries) {
      try {
        outputData = await ffmpeg.readFile(outputFileName);
        break;
      } catch (readError) {
        retryCount++;
        if (retryCount >= FFMPEG_CONFIG.maxRetries) {
          throw new Error(`Failed to read output file after ${FFMPEG_CONFIG.maxRetries} attempts`);
        }
        await new Promise((resolve) => setTimeout(resolve, FFMPEG_CONFIG.retryDelay));
      }
    }

    if (!outputData) throw new Error('Failed to read output file data');

    let finalOutputData = outputData;
    if (format === 'm3u8') finalOutputData = ensureM3U8EndTag(outputData);

    const mime = format === 'm3u8' ? 'application/x-mpegURL' : format === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    return new Blob([finalOutputData], { type: mime });
  }, [ensureM3U8EndTag]);

  const getM3U8Content = useCallback(async (): Promise<string> => {
    if (!ffmpegRef.current) return 'FFmpeg not available';
    try {
      const ffmpeg = ffmpegRef.current;
      const m3u8Data = await ffmpeg.readFile('output.m3u8');
      const text = new TextDecoder().decode(m3u8Data);
      const hasEndTag = text.includes('#EXT-X-ENDLIST');
      const status = hasEndTag ? '✅ Valid HLS Playlist' : '⚠️ Missing #EXT-X-ENDLIST';
      return `${status}\n\n${text}`;
    } catch (e) {
      return `Error reading M3U8 content: ${e}`;
    }
  }, []);

  const checkFS = useCallback(async (): Promise<boolean> => {
    try {
      if (!ffmpegRef.current) return false;
      await ffmpegRef.current.listDir('.');
      return true;
    } catch (e) {
      console.warn('FFmpeg FS check failed:', e);
      return false;
    }
  }, []);

  const collectHlsFiles = useCallback(async (): Promise<HlsFile[]> => {
    if (!ffmpegRef.current) throw new Error('FFmpeg not loaded');
    const ffmpeg = ffmpegRef.current;
    const filesToUpload: HlsFile[] = [];

    const m3u8Data = await ffmpeg.readFile('output.m3u8');
    filesToUpload.push({ name: 'playlist.m3u8', data: m3u8Data, type: 'application/x-mpegURL' });

    const files = await ffmpeg.listDir('.');
    for (const file of files) {
      const isDir = file.isDir ?? file.isDirectory ?? false;
      if (!isDir && file.name && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
        try {
          const tsData = await ffmpeg.readFile(file.name);
          filesToUpload.push({ name: file.name, data: tsData, type: 'video/mp2t' });
        } catch (segmentError) {
          console.warn(`Failed to read segment ${file.name}:`, segmentError);
        }
      }
    }

    if (filesToUpload.length === 0) throw new Error('No HLS files found for upload');
    return filesToUpload;
  }, []);

  const cleanupFiles = useCallback(async () => {
    if (!ffmpegRef.current) return;
    const ffmpeg = ffmpegRef.current;
    try {
      const filesToDelete = ['input.webm', 'output.m3u8'];
      for (const file of filesToDelete) {
        try {
          await ffmpeg.deleteFile(file);
        } catch (e) {
          console.warn(`Could not delete ${file}:`, e);
        }
      }

      try {
        const files = await ffmpeg.listDir('.');
        for (const file of files) {
          const isFile = file.isFile ?? (!file.isDir);
          if (isFile && file.name && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
            try {
              await ffmpeg.deleteFile(file.name);
            } catch (e) {
              console.warn(`Could not delete ${file.name}:`, e);
            }
          }
        }
      } catch (e) {
        console.warn('Could not list directory for cleanup:', e);
      }
    } catch (e) {
      console.warn('FFmpeg cleanup error:', e);
    }
  }, []);

  return {
    ffmpegLoaded,
    ffmpegLoading,
    error,
    loadFFmpeg,
    processBlob,
    getM3U8Content,
    checkFS,
    collectHlsFiles,
    cleanupFiles,
  };
}


