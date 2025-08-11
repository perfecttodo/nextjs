export interface AudioFile {
  id: string;
  title: string;
  url: string;
  duration: number; // in seconds
  uploadDate: Date;
  format: 'mp3' | 'x-m4a' | 'wav' | 'ogg';
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
