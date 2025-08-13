'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [userInteracted, setUserInteracted] = useState(false);
  const playerInitialized = useRef(false);

  // Initialize VideoJS player only once
  useEffect(() => {
    // Only initialize if videoRef exists and player isn't already initialized
    if (videoRef.current && !playerInitialized.current) {
      const player = videojs(videoRef.current, {
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
      playerInitialized.current=true;
      // Event listeners
// Inside your useEffect initialization
        const handleTimeUpdate = () => {
          const time = player.currentTime();
          if (typeof time === 'number') {
            setCurrentTime(time);
            const playerDuration = player.duration();
            if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
              ended();
            }
          }
        };

      const handleLoadedMetadata = () => {
        const dur = player.duration();
        if (typeof dur === 'number') setDuration(dur);
      };

      player.on('timeupdate', handleTimeUpdate);
      player.on('loadedmetadata', handleLoadedMetadata);
      player.on('ended', ended);
      player.on('play', play);
      player.on('pause', pause);

      // Cleanup function
      return () => {
        player.off('timeupdate', handleTimeUpdate);
        player.off('loadedmetadata', handleLoadedMetadata);
        player.off('ended', ended);
        player.off('play', play);
        player.off('pause', pause);
        
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
        playerInitialized.current=false;
      };
    }
  }, [playerInitialized, play, pause, ended, setCurrentTime, setDuration,videoRef.current]);

  // Handle user interaction for autoplay policies
  useEffect(() => {
    const handleInteraction = () => setUserInteracted(true);
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, []);

  // Handle audio source changes
  useEffect(() => {
    if (!playerRef.current || !audio || !playerInitialized) return;

    const player = playerRef.current;

    // Store current play state
    const wasPlaying = isPlaying;
    player.pause();

    // Set new source
    player.src({
      src: audio.blobUrl,
      type: audio.format === 'm4a' ? 'audio/mp4' : `audio/${audio.format}`
    });

    player.one('loadedmetadata', () => {
      setCurrentTime(0);
      setDuration(player.duration());
    });

    player.one('canplay', () => {
      if (wasPlaying && userInteracted) {
        player.play().catch((e: Error) => {
          console.error("Playback failed:", e);
          pause();
        });
      }
    });

    player.load();

  }, [audio, playerInitialized, userInteracted, pause, setCurrentTime, setDuration]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!playerRef.current || !playerInitialized) return;

    if (isPlaying) {
      if (userInteracted) {
        playerRef.current.play().catch((e: Error) => {
          console.error("Playback failed:", e);
          pause();
        });
      }
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, playerInitialized, userInteracted, pause]);

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!userInteracted) {
      alert('Please click anywhere on the page first to enable audio');
      return;
    }
    isPlaying ? pause() : play();
  };

  if (!audio) return null;

  return (
    <>
      {/* Video.js player (hidden) */}
      <div data-vjs-player style={{ display: 'none' }}>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          playsInline
        />
      </div>

      {/* Player UI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        {/* Progress bar */}
        <div className="absolute -top-1 left-0 right-0">
          <div className="flex items-center px-2 text-xs text-gray-500">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 mx-2 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          {/* Track info */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="ml-2 min-w-0">
              <div className="font-medium text-sm truncate">{audio.title}</div>
              <div className="text-xs text-gray-500">
                {formatTime(audio.duration || 0)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button onClick={previous} className="p-2 text-gray-600 hover:text-gray-900">
              ⏮️
            </button>
            <button 
              onClick={togglePlayPause} 
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={next} className="p-2 text-gray-600 hover:text-gray-900">
              ⏭️
            </button>
          </div>

          {/* Play mode */}
          <button 
            onClick={cyclePlayMode}
            className="p-2 text-gray-600 hover:text-gray-900"
            title={`Play mode: ${playMode}`}
          >
            {playMode === 'loop' ? '🔁' : playMode === 'random' ? '🔀' : '→'}
          </button>
        </div>
      </div>
    </>
  );
}