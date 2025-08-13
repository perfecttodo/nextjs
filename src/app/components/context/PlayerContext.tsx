'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { AudioPlayerState, AudioFile } from '@/types/audio';

const PlayerContext = createContext<AudioPlayerState | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playTrack = (track: AudioFile) => {
    if (currentTrack?.id !== track.id) {
      setCurrentTrack(track);
      setIsPlaying(true);
    } else {
      togglePlay();
    }
  };

  const pause = () => setIsPlaying(false);
  
  const togglePlay = () => setIsPlaying(prev => !prev);

  const value = {
    currentTrack,
    isPlaying,
    playTrack,
    pause,
    togglePlay
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div>Player</div>
    </PlayerContext.Provider>
  );
};

export const useAudio = (): AudioPlayerState => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};