'use client';

import { createContext, useState, useContext, ReactNode, useRef } from 'react';
import { AudioPlayerState, AudioFile } from '@/types/audio';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
const PlayerContext = createContext<AudioPlayerState | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);


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
      <>
        {/* Hidden VideoJS Player */}
        <div className="hidden">
          <video
            ref={videoRef}
            className="video-js vjs-default-skin"
            data-setup="{}"
          />
        </div>

        {/* Fixed Bottom Audio */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          {/* Collapsed View - TingFM Style */}
          <div className="space-y-2 absolute -top-1 left-0 right-0">
            <div className="flex text-xs text-gray-500">
              <span></span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                  style={{
                  }}
                />
              </div>
              <span></span>
            </div>

          </div>

          <div className="flex items-center justify-between px-4 py-2">
            {/* Audio Info - Left Side */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-lg text-gray-600">
                🎵
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 truncate text-sm"></div>
                <div className="text-xs text-gray-500">
                </div>
              </div>
            </div>

            {/* Center Controls - TingFM Style */}
            <div className="flex items-center space-x-3">
              {/* Previous Button */}
              <button
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                title="Previous"
              >
                ⏮️
              </button>

              {/* Play/Pause Button - Main Control */}
              <button
                className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              {/* Next Button */}
              <button
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                title="Next"
              >
                ⏭️
              </button>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2">
              {/* Play Mode */}
              <button
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-sm"
              >
              </button>

            </div>
          </div>
        </div>

        {/* Custom CSS for slider */}
        <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      </>

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