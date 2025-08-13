// store/audioPlayerStore.ts
import { create } from 'zustand';

type PlayMode = 'sequence' | 'loop' | 'random';
type AudioFile = {
  id: string;
  title: string;
  blobUrl: string;
  format: string;
  duration?: number;
};

interface AudioPlayerState {
  audio: AudioFile | null;
  isPlaying: boolean;
  playMode: PlayMode;
  audioFiles: AudioFile[];
  currentIndex: number;
  currentTime: number;
  duration: number;
  setAudio: (audio: AudioFile) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  ended: () => void;
  cyclePlayMode: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  audio: null,
  isPlaying: false,
  playMode: 'sequence',
  audioFiles: [],
  currentIndex: -1,
  currentTime: 0,
  duration: 0,

  setAudio: (audio) => set({ audio, isPlaying: true }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  play: () => set({ isPlaying: true }),
  
  pause: () => set({ isPlaying: false }),
  
  next: () => {
    const { audioFiles, currentIndex, playMode } = get();
    if (audioFiles.length === 0) return;

    let nextIndex;
    if (playMode === 'random') {
      nextIndex = Math.floor(Math.random() * audioFiles.length);
    } else {
      nextIndex = (currentIndex + 1) % audioFiles.length;
    }
    
    set({
      currentIndex: nextIndex,
      audio: audioFiles[nextIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },
  
  previous: () => {
    const { audioFiles, currentIndex } = get();
    if (audioFiles.length === 0) return;

    const prevIndex = currentIndex <= 0 ? audioFiles.length - 1 : currentIndex - 1;
    set({
      currentIndex: prevIndex,
      audio: audioFiles[prevIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },
  
  ended: () => {
    const { playMode } = get();
    if (playMode === 'loop') {
      set({ currentTime: 0, isPlaying: true });
    } else {
      get().next();
    }
  },
  
  cyclePlayMode: () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'random'];
    const currentMode = get().playMode;
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    set({ playMode: modes[nextIndex] });
  },
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setDuration: (duration) => set({ duration }),
}));