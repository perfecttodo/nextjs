// store/audioPlayerStore.ts
import { create } from 'zustand';
import { Episode } from '@/types/audio';

type PlayMode = 'sequence' | 'loop' | 'random';


type PlayerCallback = (state: AudioPlayerState) => void;

interface AudioPlayerState {
  audio: Episode | null;
  isPlaying: boolean;
  status:string,
  isToggle:boolean;
  playMode: PlayMode;
  episodes: Episode[];
  currentIndex: number;
  currentTime: number;
  duration: number;
  playHistory: Episode[];
  callback: PlayerCallback | null;
  
  // State actions
  setAudio: (audio: Episode) => void;
  setAudioFiles:(episodes:Episode[])=>void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  ended: () => void;
  cyclePlayMode: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  
  // Playlist management
  removeTrack: (index: number) => void;
  
  // Play history management
  addToHistory: (audio: Episode) => void;
  clearHistory: () => void;
  removeFromHistory: (index: number) => void;
  
  // Callback management
  setCallback: (callback: PlayerCallback | null) => void;
  setStatus:(s:string)=>void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => {
  // Load play history from localStorage on initialization
  let initialPlayHistory: Episode[] = [];
  try {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('localPlayHistory');
      if (savedHistory) {
        initialPlayHistory = JSON.parse(savedHistory);
      }
    }
  } catch (error) {
    console.error('Failed to load play history from localStorage:', error);
  }

  return {
    audio: null,
    isPlaying: false,
    status:'',
    isToggle:false,
    playMode: 'sequence',
    episodes: [],
    currentIndex: -1,
    currentTime: 0,
    duration: 0,
    playHistory: initialPlayHistory,
    callback: null,

  setAudio: (audio) => {
    const { episodes } = get();
    const currentIndex = episodes.findIndex(file => file.id === audio.id);
    set({ audio, isPlaying: true, currentIndex: currentIndex >= 0 ? currentIndex : -1 });
    
    // Add to play history
    get().addToHistory(audio);
    
    get().callback?.(get());
  },
  setAudioFiles:(episodes)=>{
    set({ episodes, currentIndex: -1 });
  },
  togglePlay: () => {
    console.log(get());
    set((state) => ({ isToggle: !state.isToggle }));
    get().callback?.(get());
  },
  
  play: () => {
    set({ isPlaying: true });
    get().callback?.(get());
  },
  
  pause: () => {
    set({ isPlaying: false });
    get().callback?.(get());
  },
  setStatus(b:string){
    set({status:b})
  },
  
  next: () => {
    const { episodes, currentIndex, playMode } = get();
    if (episodes.length === 0) return;

    let nextIndex;
    if (playMode === 'random') {
      nextIndex = Math.floor(Math.random() * episodes.length);
    } else {
      nextIndex = (currentIndex + 1) % episodes.length;
    }
    set({audio:null});
    set({
      currentIndex: nextIndex,
      audio: episodes[nextIndex],
      isPlaying: true,
      currentTime: 0,
    });
    get().callback?.(get());
  },
  
  previous: () => {
    const { episodes, currentIndex } = get();
    if (episodes.length === 0) return;

    const prevIndex = currentIndex <= 0 ? episodes.length - 1 : currentIndex - 1;
    set({
      currentIndex: prevIndex,
      audio: episodes[prevIndex],
      isPlaying: true,
      currentTime: 0,
    });
    get().callback?.(get());
  },
  
  ended: () => {
    const { playMode } = get();
    if (playMode === 'loop') {
      set({ currentTime: 0, isPlaying: true });
    } else {
      get().next();
    }
    get().callback?.(get());
  },
  
  cyclePlayMode: () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'random'];
    const currentMode = get().playMode;
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    set({ playMode: modes[nextIndex] });
    get().callback?.(get());
  },
  
  setCurrentTime: (time) => {
    set({ currentTime: time });
    get().callback?.(get());
  },
  
  setDuration: (duration) => {
    set({ duration });
    get().callback?.(get());
  },

  // Playlist management
  removeTrack: (index) => {
    const { episodes, currentIndex, audio, isPlaying } = get();
    if (index < 0 || index >= episodes.length) return;
    
    const newAudioFiles = episodes.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;
    let newAudio = audio;
    
    // Adjust current index if needed
    if (newAudioFiles.length === 0) {
      // No tracks left
      newCurrentIndex = -1;
      newAudio = null;
    } else if (index <= currentIndex) {
      // Current track or track before current was removed
      if (index === currentIndex) {
        // Current track was removed, play next track
        newCurrentIndex = Math.min(index, newAudioFiles.length - 1);
        newAudio = newAudioFiles[newCurrentIndex];
      } else {
        // Track before current was removed, adjust index
        newCurrentIndex = currentIndex - 1;
      }
    }
    
    set({
      episodes: newAudioFiles,
      currentIndex: newCurrentIndex,
      audio: newAudio,
      isPlaying: newAudio ? isPlaying : false,
    });
    get().callback?.(get());
  },

  // Play history management
  addToHistory: (audio) => {
    const { playHistory } = get();
    // Remove if already exists to avoid duplicates
    const filteredHistory = playHistory.filter(item => item.id !== audio.id);
    // Add to beginning of history
    const newHistory = [audio, ...filteredHistory].slice(0, 50); // Keep last 50 items
    
    set({ playHistory: newHistory });
    
    // Save to localStorage
    try {
      localStorage.setItem('localPlayHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save play history to localStorage:', error);
    }
    
    get().callback?.(get());
  },

  clearHistory: () => {
    set({ playHistory: [] });
    
    // Clear from localStorage
    try {
      localStorage.removeItem('localPlayHistory');
    } catch (error) {
      console.error('Failed to clear play history from localStorage:', error);
    }
    
    get().callback?.(get());
  },

  removeFromHistory: (index) => {
    const { playHistory } = get();
    if (index < 0 || index >= playHistory.length) return;
    
    const newHistory = playHistory.filter((_, i) => i !== index);
    set({ playHistory: newHistory });
    
    // Update localStorage
    try {
      localStorage.setItem('localPlayHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to update play history in localStorage:', error);
    }
    
    get().callback?.(get());
  },

  // Single callback management
  setCallback: (callback) => {
    set({ callback });
  }
  };
});