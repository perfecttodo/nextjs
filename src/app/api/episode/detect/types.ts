// types/audio.ts
export type AudioFormat = 
  | 'mp3' 
  | 'wav' 
  | 'ogg' 
  | 'flac' 
  | 'aac' 
  | 'm4a' 
  | 'webm' 
  | 'opus' 
  | 'm3u8'
  | 'unknown';

export interface AudioFormatDetection {
  url: string;
  format: AudioFormat;
  mimeType: string | null;
  contentLength: number | null;
  isStream: boolean;
  success: boolean;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}