'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Episode } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import { PulseLoader } from 'react-spinners';

interface AudioDetailClientProps {
  audioId: string;
}

export default function AudioDetailClient({ audioId }: AudioDetailClientProps) {
  const [audio, setAudioState] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setAudio, setAudioFiles, audio: currentAudio, togglePlay, isPlaying } = useAudioPlayerStore();

  useEffect(() => {
    if (!audioId) return;

    const fetchAudioDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/episode/${audioId}`);
        if (response.ok) {
          const data = await response.json();
          setAudioState(data.audio);
        } else {
          setError('Audio file not found');
        }
      } catch (error) {
        setError('Failed to load audio file');
      } finally {
        setLoading(false);
      }
    };

    fetchAudioDetails();
  }, [audioId, setAudio, setAudioFiles]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <PulseLoader color="#3498db" loading={loading} size={15} />
            <p className="text-gray-600">Loading audio details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Audio file not found'}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>←</span>
            <span>Back to Audio List</span>
          </button>
        </div>

        {/* Audio Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start space-x-6">
            <div className="text-6xl">
              {getFormatIcon(audio.format)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{audio.title}</h1>
              <p className="text-gray-600 text-lg mb-4">{audio.originalName}</p>
              
              {/* Play/Pause Button */}
              <button
                onClick={() => setAudio(audio)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentAudio?.id === audio.id && isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {currentAudio?.id === audio.id && isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
            </div>
          </div>
        </div>

        {/* Audio Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">{audio.format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {audio.duration ? formatTime(audio.duration) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Size:</span>
                <span className="font-medium">{formatFileSize(audio.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  audio.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {audio.status.charAt(0).toUpperCase() + audio.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Timestamps</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(audio.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(audio.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = audio.blobUrl;
                link.download = audio.originalName;
                link.click();
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              📥 Download
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              🔗 Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}