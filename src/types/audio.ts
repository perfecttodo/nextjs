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

export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  ownerId: string;
  episodes?: Episode[];
  albums?: Album[]; // Add albums relationship
  _count?: {
    episodes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  color?: string;
  ownerId: string;
  groupId?: string;
  group?: Group;
  categoryId?: string;
  category?: Category;
  subcategoryId?: string;
  subcategory?: Subcategory;
  episodes?: Episode[];
  _count?: {
    episodes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  title: string;
  originalName: string;
  blobUrl: string;
  blobId: string;
  format: AudioFormat;
  duration?: number; // in seconds
  fileSize: number; // in bytes
  status: AudioStatus;
  language?: string; // Language of the audio content
  description?: string; // Description of the audio content
  originalWebsite?: string; // Original website where audio was found (optional)
  ownerId: string;
  categoryId?: string;
  category?: Category;
  subcategoryId?: string;
  subcategory?: Subcategory;
  labels?: Label[];
  groupId?: string;
  group?: Group;
  albumId?: string; // Add album relationship
  album?: Album;
  createdAt: string;
  updatedAt: string;
}

export type PlayMode = 'sequence' | 'loop' | 'random';

export interface AudioPlayerProps {
  audio: Episode | null;
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
  episodes: Episode[];
  currentAudio: Episode | null;
  onAudioSelect: (audio: Episode) => void;
  isPlaying:boolean
}



export interface AudioPlayerState {
  currentTrack: Episode | null;
  isPlaying: boolean;
  playTrack: (track: Episode) => void;
  pause: () => void;
  togglePlay: () => void;
}