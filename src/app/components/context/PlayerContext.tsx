'use client';

import { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { AudioPlayerState, AudioFile } from '@/types/audio';

const PlayerContext = createContext<AudioPlayerState | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Handle play/pause based on state
    if (audioRef.current) {
      isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    // Handle track changes
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

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

  if (!isClient) {
    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        className="hidden"
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Player UI */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          {/* Progress bar */}
          <div className="space-y-2 absolute -top-1 left-0 right-0">
            <div className="flex text-xs text-gray-500">
              <span></span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <span></span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            {/* Track info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-lg text-gray-600">🎵</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 truncate text-sm">
                  {currentTrack?.title || 'No track selected'}
                </div>
                <div className="text-xs text-gray-500">
                  {currentTrack?.artist || 'Unknown artist'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              <button
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                title="Previous"
              >
                ⏮️
              </button>

              <button
                className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
                onClick={togglePlay}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              <button
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                title="Next"
              >
                ⏭️
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              <button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-sm">
                🔀
              </button>
            </div>
          </div>
        </div>
      )}
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