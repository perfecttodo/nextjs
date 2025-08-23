'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import PlayButton from '@/app/components/PlayButton'
import HLSPlayer from './HLSPlayer'

export default function FixedAudioPlayer() {
  const {
    audio,
    isPlaying,
    playMode,
    currentTime,
    duration,
    episodes,
    currentIndex,
    playHistory,
    play,
    pause,
    next,
    previous,
    cyclePlayMode,
    setAudio,
    removeTrack,
    removeFromHistory,
    clearHistory,isToggle,togglePlay,setStatus
  } = useAudioPlayerStore();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [viewMode, setViewMode] = useState<'playlist' | 'history'>('playlist');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const playerRef = useRef<any>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // Function to handle clear history with confirmation
  const handleClearHistory = () => {
    if (!showClearConfirm) {
      // First click - show confirmation
      setShowClearConfirm(true);
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => setShowClearConfirm(false), 5000);
    } else {
      // Second click - actually clear history
      clearHistory();
      setShowClearConfirm(false);
    }
  };

  // Format time helper
  const formatTime = (time: number) => {
    if (isNaN(time) || time === undefined || time < 0) {
      return "NA";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



  useEffect(() => {
    if (!playerRef.current) return;

    if (!playerRef.current.paused()) {
      playerRef.current.pause()
      pause();
    } else {
      playerRef.current.play();
      play();
    }
  }, [isToggle, userInteracted]);


  if (!audio) return null;

  return (
    <div style={{ marginTop: '60px' }}>
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

      <HLSPlayer/>

      <div
        className={`fixed right-0 top-16 bottom-20 w-80 bg-white border-l border-gray-200 z-40 overflow-y-auto transition-all duration-300 ease-in-out transform ${showPlaylist
          ? 'translate-x-0 shadow-2xl'
          : 'translate-x-full shadow-none'
          }`}
        style={{
          animation: showPlaylist ? 'slideInBounce 0.4s ease-out' : 'none'
        }}
      >
        <div className={`p-4 border-b border-gray-200 transition-all duration-500 ease-in-out ${showPlaylist ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {viewMode === 'playlist' ? 'Playlist' : 'Play History'}
              </h3>
              <p className="text-sm text-gray-500">
                {viewMode === 'playlist' ? `${episodes.length} tracks` : `${playHistory.length} items`}
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
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${viewMode === 'playlist'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Playlist
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${viewMode === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-blue-600 hover:text-blue-700'
                }`}
            >
              History
            </button>
          </div>
        </div>
        <div className={`p-2 transition-opacity duration-500 ease-in-out ${showPlaylist ? 'opacity-100' : 'opacity-0'
          }`}>
          {viewMode === 'playlist' ? (
            episodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎵</div>
                <p>No tracks in playlist</p>
              </div>
            ) : (
              episodes.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => setAudio(track)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out group ${currentIndex === index
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
                      <div className={`font-medium text-sm truncate ${currentIndex === index ? 'text-blue-700' : 'text-gray-800'
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

                {/* Clear History Button with Confirmation */}
                <div className="pt-2 border-t border-gray-100">
                  {showClearConfirm ? (
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm text-red-600 font-medium text-center">
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleClearHistory}
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                        >
                          Yes, Clear All
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleClearHistory}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
                    >
                      <span>🗑️</span>
                      <span className="ml-2">Clear All History</span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Backdrop overlay for click outside */}
      <div
        className={`fixed inset-0  z-30 transition-all duration-300 ease-in-out ${showPlaylist
          ? 'bg-opacity-25 pointer-events-auto'
          : 'bg-opacity-0 pointer-events-none'
          }`}
        onClick={() => setShowPlaylist(false)}
      />

      {/* Player UI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <HLSPlayer/>


        <div className="flex items-center justify-between px-4 py-3">
          {/* Track info */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="ml-2 min-w-0">
              <div className="font-medium text-sm truncate">{audio.title}</div>
              <div className="text-xs text-gray-500">
                {episodes.length > 0 && (
                  <span className="mr-2">
                    {currentIndex + 1} of {episodes.length}
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
            <PlayButton episode={audio} episodes={null}/>
            <button onClick={next} className="p-2 text-gray-600 hover:text-gray-900">
              ⏭️
            </button>
          </div>

          {/* Playlist toggle */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-2 rounded-md transition-all duration-200 ease-in-out relative transform ${showPlaylist
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
              }`}
            title={showPlaylist ? 'Hide playlist' : 'Show playlist'}
          >
            {viewMode === 'history' ? '⏰' : '📋'}
      
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