'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { AudioPlayerProps, PlayMode } from '../../types/audio';

export default function AudioPlayer({
  audio,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onEnded,
  playMode,
  onPlayModeChange
}: AudioPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize VideoJS player
    const videoElement = videoRef.current;
    if (!playerRef.current) {
      const player = videojs(videoElement, {
        controls: false,
        autoplay: false,
        preload: 'metadata',
        fluid: true,
        responsive: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          children: []
        }
      });

      playerRef.current = player;

      // Event listeners
      player.on('timeupdate', () => {
        const time = player.currentTime();
        if (typeof time === 'number') {
          setCurrentTime(time);
        }
      });

      player.on('loadedmetadata', () => {
        const duration = player.duration();
        if (typeof duration === 'number') {
          setDuration(duration);
        }
      });

      player.on('ended', () => {
        onEnded();
      });

      player.on('play', () => {
        onPlay();
      });

      player.on('pause', () => {
       // onPause();
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [onPlay, onPause, onEnded]);

  useEffect(() => {
    if (playerRef.current && audio) {
      playerRef.current.src({
        src: audio.blobUrl,
        type: audio.format === 'm4a' ? 'audio/mp4' : `audio/${audio.format}`
      });
      
      if (isPlaying) {
        playerRef.current.play();
      }
    }
  }, [audio, isPlaying]);

  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.currentTime(time);
      setCurrentTime(time);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const getPlayModeIcon = (mode: PlayMode) => {
    switch (mode) {
      case 'sequence':
        return '🔀';
      case 'loop':
        return '🔁';
      case 'random':
        return '🎲';
      default:
        return '🔀';
    }
  };

  const getPlayModeLabel = (mode: PlayMode) => {
    switch (mode) {
      case 'sequence':
        return 'Sequence';
      case 'loop':
        return 'Loop';
      case 'random':
        return 'Random';
      default:
        return 'Sequence';
    }
  };

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'random'];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onPlayModeChange(modes[nextIndex]);
  };

  if (!audio) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">🎵</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Audio Selected</h3>
        <p className="text-gray-400">Select an audio file from the list to start playing</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Audio Info */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{audio.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Format: {audio.format.toUpperCase()}</span>
          <span>Duration: {audio.duration ? formatTime(audio.duration) : 'Unknown'}</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Uploaded: {audio.createdAt.toLocaleDateString()}
        </div>
      </div>

      {/* VideoJS Player (Hidden but functional) */}
      <div className="hidden">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          data-setup="{}"
        />
      </div>

      {/* Custom Audio Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onPrevious}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Previous"
          >
            ⏮️
          </button>
          
          <button
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={onNext}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Next"
          >
            ⏭️
          </button>
        </div>

        {/* Play Mode */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={cyclePlayMode}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title={`Current mode: ${getPlayModeLabel(playMode)}`}
          >
            <span className="text-lg">{getPlayModeIcon(playMode)}</span>
            <span className="text-sm font-medium">{getPlayModeLabel(playMode)}</span>
          </button>
        </div>
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
