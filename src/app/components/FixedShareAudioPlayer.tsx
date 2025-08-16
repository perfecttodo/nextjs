'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import { AudioFile } from '@/types/audio';

export default function FixedAudioPlayer() {
  const {
    audio,
    isPlaying,
    playMode,
    currentTime,
    duration,
    audioFiles,
    currentIndex,
    playHistory,
    play,
    pause,
    next,
    previous,
    ended,
    cyclePlayMode,
    setCurrentTime,
    setDuration,
    setAudio,
    removeTrack,
    removeFromHistory,
    clearHistory,
  } = useAudioPlayerStore();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [viewMode, setViewMode] = useState<'playlist' | 'history'>('playlist');

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    const time = playerRef.current.currentTime();
    if (typeof time === 'number') {
      setCurrentTime(time);
      const playerDuration = playerRef.current.duration();
      if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
        ended();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!playerRef.current) return;
    const dur = playerRef.current.duration();
    if (typeof dur === 'number') setDuration(dur);
  };

  const handleEnded = () => {
    console.log('end')
    ended();

  };


  // Initialize VideoJS player and handle events
  useEffect(() => {
    if (!videoRef.current) return;

    let player = playerRef.current;

    if (player) return;

    if (!player) {
      player = videojs(videoRef.current, {
        html5: {
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true
          }
        },
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
    }



    player.on('timeupdate', handleTimeUpdate);
    player.on('loadedmetadata', handleLoadedMetadata);
    player.on('ended', handleEnded);
    player.on('play', play);
    player.on('pause', pause);

    // Set up Media Session API for background control
    if ('mediaSession' in navigator && audio) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: audio.title || 'Unknown',
        artist: 'Unknown Artist',
        album: 'Unknown Album'
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (playerRef.current) {
          playerRef.current.play().catch((e: Error) => console.error('MediaSession play error:', e));
          play();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (playerRef.current) {
          playerRef.current.pause();
          pause();
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('MediaSession next track');
        next();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('MediaSession previous track');
        previous();
      });

      try {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skipTime = details.seekOffset || 10;
          if (playerRef.current) {
            playerRef.current.currentTime(Math.max(0, playerRef.current.currentTime() - skipTime));
          }
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skipTime = details.seekOffset || 10;
          if (playerRef.current) {
            playerRef.current.currentTime(Math.min(
              playerRef.current.duration(),
              playerRef.current.currentTime() + skipTime
            ));
          }
        });
      } catch (error) {
        console.log('Seek actions not supported:', error);
      }
    }

    return () => {

      // Note: Player disposal is handled in a separate useEffect
    };
  }, [audio]);

  // Cleanup player on component unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        let player = playerRef.current;
        player.off('timeupdate', handleTimeUpdate);
        player.off('loadedmetadata', handleLoadedMetadata);
        player.off('ended', handleEnded);
        player.off('play', play);
        player.off('pause', pause);

        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
        }

        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);


  function getType(audio: AudioFile) {
    switch (audio.format) {
      case 'm4a':
        return 'audio/mp4';
      case 'm3u8':
        return 'application/x-mpegURL';
      default:
        return 'audio/mpeg';
    }
  }
  // Handle user interaction for autoplay policies
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, []);

  // Handle audio source changes
  useEffect(() => {
    if (!playerRef.current || !audio) return;

    const player = playerRef.current;
    const wasPlaying = isPlaying;
    player.pause();

    let url = audio.blobUrl
    let type = getType(audio);

    player.src({
      src: url,
      type
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
    player.play().catch((e: Error) => {
      console.error("Initial playback failed:", e);
      pause();
    });

  }, [audio, userInteracted, pause, setCurrentTime, setDuration]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying && userInteracted) {
      playerRef.current.play().catch((e: Error) => {
        console.error("Playback failed:", e);
        pause();
      });
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, userInteracted, pause]);

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
    isPlaying ? pause() : play();
  };

  if (!audio) return null;

  return (
    <div style={{marginTop:'60px'}}>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInBounce {
          0% {
            transform: translateX(100%);
          }
          70% {
            transform: translateX(-5%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Video.js player (hidden) */}
      <div data-vjs-player style={{ display: 'none' }}>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          playsInline
          webkit-playsinline="true"
        />
      </div>

      {/* Playlist Sidebar - Now slides from right */}
      <div 
        className={`fixed right-0 top-16 bottom-20 w-80 bg-white border-l border-gray-200 z-40 overflow-y-auto transition-all duration-300 ease-in-out transform ${
          showPlaylist 
            ? 'translate-x-0 shadow-2xl' 
            : 'translate-x-full shadow-none'
        }`}
        style={{
          animation: showPlaylist ? 'slideInBounce 0.4s ease-out' : 'none'
        }}
      >
          <div className={`p-4 border-b border-gray-200 transition-all duration-500 ease-in-out ${
            showPlaylist ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {viewMode === 'playlist' ? 'Playlist' : 'Play History'}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewMode === 'playlist' ? `${audioFiles.length} tracks` : `${playHistory.length} items`}
                </p>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close playlist"
              >
                ✕
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('playlist')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  viewMode === 'playlist'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Playlist
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  viewMode === 'history'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                History
              </button>
            </div>
          </div>
          <div className={`p-2 transition-opacity duration-500 ease-in-out ${
            showPlaylist ? 'opacity-100' : 'opacity-0'
          }`}>
            {viewMode === 'playlist' ? (
              audioFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎵</div>
                  <p>No tracks in playlist</p>
                </div>
              ) : (
                audioFiles.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => setAudio(track)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out group ${
                      currentIndex === index
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      animationDelay: showPlaylist ? `${index * 50}ms` : '0ms',
                      animation: showPlaylist ? 'fadeInUp 0.5s ease-out forwards' : 'none'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {currentIndex === index && isPlaying ? (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 text-gray-400 text-center text-sm">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          currentIndex === index ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {track.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {track.originalName}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-400">
                          {track.duration ? formatTime(track.duration) : '--:--'}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrack(index);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from playlist"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              playHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⏰</div>
                  <p>No play history yet</p>
                  <p className="text-xs text-gray-400 mt-1">Tracks you play will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {playHistory.map((track, index) => (
                    <div
                      key={track.id}
                      onClick={() => setAudio(track)}
                      className="p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out group hover:bg-gray-50"
                      style={{
                        animationDelay: showPlaylist ? `${index * 50}ms` : '0ms',
                        animation: showPlaylist ? 'fadeInUp 0.5s ease-out forwards' : 'none'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 text-gray-400 text-center text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate text-gray-800">
                            {track.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {track.originalName}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-400">
                            {track.duration ? formatTime(track.duration) : '--:--'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(index);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove from history"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Clear History Button */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={clearHistory}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      🗑️ Clear All History
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Backdrop overlay for click outside */}
        <div 
          className={`fixed inset-0  z-30 transition-all duration-300 ease-in-out ${
            showPlaylist 
              ? 'bg-opacity-25 pointer-events-auto' 
              : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowPlaylist(false)}
        />

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
                {audioFiles.length > 0 && (
                  <span className="mr-2">
                    {currentIndex + 1} of {audioFiles.length}
                  </span>
                )}
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

          {/* Playlist toggle */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-2 rounded-md transition-all duration-200 ease-in-out relative transform ${
              showPlaylist 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 scale-105' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
            }`}
            title={showPlaylist ? 'Hide playlist' : 'Show playlist'}
          >
            {viewMode === 'history' ? '⏰' : '📋'}
            {audioFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {audioFiles.length}
              </span>
            )}
            {playHistory.length > 0 && (
              <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {playHistory.length}
              </span>
            )}
          </button>

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
    </div>
  );
}