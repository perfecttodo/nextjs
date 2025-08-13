export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'ogg';

export type AudioStatus = 'draft' | 'published';

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
  createdAt: Date;
  updatedAt: Date;
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
  currentIndex: number;
}

// types/audio.ts
export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  // add any other track properties you need
}

export interface AudioPlayerState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  playTrack: (track: AudioTrack) => void;
  pause: () => void;
  togglePlay: () => void;
}