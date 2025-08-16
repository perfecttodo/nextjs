export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'ogg'|'m3u8';

export type AudioStatus = 'draft' | 'published';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color?: string;
  description?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudioFile {
  id: string;
  title: string;
  originalName: string;
  blobUrl: string;
  blobId: string;
  format: AudioFormat;
  duration?: number; // in seconds
  fileSize: number; // in bytes
  status: AudioStatus;
  ownerId: string;
  categoryId?: string;
  category?: Category;
  subcategoryId?: string;
  subcategory?: Subcategory;
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}

export type PlayMode = 'sequence' | 'loop' | 'random';

export interface AudioPlayerProps {
  audio: AudioFile | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onEnded: () => void;
  playMode: PlayMode;
  onPlayModeChange: (mode: PlayMode) => void;
}

export interface AudioListProps {
  audioFiles: AudioFile[];
  currentAudio: AudioFile | null;
  onAudioSelect: (audio: AudioFile) => void;
  isPlaying:boolean
}



export interface AudioPlayerState {
  currentTrack: AudioFile | null;
  isPlaying: boolean;
  playTrack: (track: AudioFile) => void;
  pause: () => void;
  togglePlay: () => void;
}