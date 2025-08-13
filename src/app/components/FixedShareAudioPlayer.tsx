'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';

export default function FixedAudioPlayer() {
  const {
    audio,
    isPlaying,
    playMode,
    currentTime,
    duration,
    play,
    pause,
    next,
    previous,
    ended,
    cyclePlayMode,
    setCurrentTime,
    setDuration,
  } = useAudioPlayerStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  // Initialize VideoJS player
  useEffect(() => {
    if (!videoRef.current) return;

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

          // Check if audio has ended
          const duration = player.duration();
          if (typeof duration === 'number' && isFinite(duration) && duration > 0 && time >= duration - 0.1) {
            ended();
          }
        }
      });

      player.on('loadedmetadata', () => {
        const duration = player.duration();
        if (typeof duration === 'number') {
          setDuration(duration);
        }
      });

      player.on('ended', () => {
        ended();
      });

      player.on('play', () => {
        play();
      });

      player.on('pause', () => {
        pause();
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [play, pause, ended, setCurrentTime, setDuration]);

  // Handle audio changes
  useEffect(() => {
    if (playerRef.current && audio) {
      const player = playerRef.current;

      // Reset player state before changing source
      player.pause();
      setCurrentTime(0);
      setDuration(0);

      // Change source
      player.src({
        src: audio.blobUrl,
        type: audio.format === 'm4a' ? 'audio/mp4' : `audio/${audio.format}`
      });

      // Load the new audio
      player.load();

      // Resume playing if it was playing before
      if (isPlaying) {
        setTimeout(() => {
          if (playerRef.current && isPlaying) {
            playerRef.current.play();
          }
        }, 100);
      }
    }
  }, [audio, isPlaying, setCurrentTime, setDuration]);

  // Handle play/pause state changes
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
      pause();
    } else {
      play();
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

  if (!audio) {
    return null;
  }

  return (
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
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          {/* Audio Info - Left Side */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="text-lg text-gray-600">
              🎵
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 truncate text-sm">{audio.title}</div>
              <div className="text-xs text-gray-500">
                {audio.duration ? formatTime(audio.duration) : '--:--'}
              </div>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={previous}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              title="Previous"
            >
              ⏮️
            </button>

            <button
              onClick={togglePlayPause}
              className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={next}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              title="Next"
            >
              ⏭️
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={cyclePlayMode}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-sm"
              title={`Mode: ${playMode}`}
            >
              {getPlayModeIcon(playMode)}
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
  );
}