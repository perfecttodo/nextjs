'use client';

import { memo } from 'react';
import { AudioListProps } from '@/types/audio';
import { useRouter } from 'next/navigation';

function AudioListComponent({
  episodes,
  currentAudio,
  onAudioSelect,
  isPlaying
}: AudioListProps) {
  const router = useRouter();
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'mp3':
        return '🎵';
      case 'x-m4a':
        return '🎶';
      case 'wav':
        return '📻';
      case 'ogg':
        return '🎧';
      default:
        return '🎵';
    }
  };

  if (episodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Audio Files</h3>
        <p className="text-gray-400">Upload some episodes to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Latest Audio</h3>
        <div className="text-sm text-gray-500">
          {episodes.length} file{episodes.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {episodes.map((audio, index) => (
          <div
            key={audio.id}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              currentAudio?.id === audio.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Format Icon */}
              <div className="text-2xl">
                {getFormatIcon(audio.format)}
              </div>

              {/* Audio Info */}
              <div 
                className="flex-1 min-w-0 cursor-pointer hover:bg-blue-50 p-2 rounded transition-all duration-200 group border border-transparent hover:border-blue-200"
                onClick={() => router.push(`/episode/${audio.id}`)}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {audio.title}
                  </h4>
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    👁️ View Details
                  </span>
                  {currentAudio?.id === audio.id && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Playing
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{formatDate(audio.createdAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>⏱️</span>
                    <span>{audio.duration ? formatTime(audio.duration) : 'Unknown'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>📁</span>
                    <span className="uppercase">{audio.format}</span>
                  </span>
                </div>
              </div>

              {/* Play Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAudioSelect(audio);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    currentAudio?.id === audio.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={currentAudio?.id === audio.id ? 'Currently Playing' : 'Play Audio'}
                >
                  {currentAudio?.id === audio.id && isPlaying ? '⏸️' : '▶️'}
                </button>
              </div>
            </div>

            {/* Progress indicator for currently playing audio */}
            {currentAudio?.id === audio.id && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state when no files */}
      {episodes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎵</div>
          <p className="text-gray-500">No episodes available</p>
        </div>
      )}
    </div>
  );
}

export default memo(AudioListComponent);
