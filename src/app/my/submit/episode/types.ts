import { AudioStatus } from '@/types/audio';

export type TabType = 'upload' | 'record'| 'record2' | 'url';

export const OUTPUT_FORMATS = ['m3u8', 'mp3', 'm4a'] as const;
export type OutputFormat = typeof OUTPUT_FORMATS[number];

export interface TabConfig {
  id: TabType;
  label: string;
  description: string;
  icon: string;
  shortLabel: string;
}

export interface SharedFormData {
  title: string;
  status: AudioStatus;
  language: string;
  description: string;
  originalWebsite: string;
  albumId: string;
  format: string;
  url: string;
}
export interface AudioCreationTabsProps {
  onUploadSuccess: () => void;
}

export interface AudioProcessingState {
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string;
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  duration: number;
  outputFormat: OutputFormat;
  showM3U8Content: boolean;
  m3u8Content: string;
  m3u8ContentLoading: boolean;
  useFFmpeg: boolean;
  isFormatable: boolean;
}