'use client';

import { useState } from 'react';
import Link from 'next/link';

// Type for the album data from Prisma
type AlbumWithAudio = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  ownerId: string;
  groupId: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  group: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  episodes: {
    id: string;
    title: string;
    originalName: string;
    format: string;
    duration: number | null;
    fileSize: number;
    status: string;
    language: string | null;
    description: string | null;
    originalWebsite: string | null;
    createdAt: Date;
    labels: {
      id: string;
      name: string;
      color: string | null;
    }[];
  }[];
  _count: {
    episodes: number;
  };
};

interface AlbumAudioClientProps {
  album: AlbumWithAudio;
  episodes: AlbumWithAudio['episodes'];
  userId: string;
}

export default function AlbumAudioClient({ album, episodes, userId }: AlbumAudioClientProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs',
      published: 'px-2 py-1 bg-green-100 text-green-800 rounded text-xs',
    };
    return statusClasses[status as keyof typeof statusClasses] || statusClasses.draft;
  };

  const handleRemoveFromAlbum = async (episodeId: string) => {
    if (!confirm('Are you sure you want to remove this audio file from the album?')) {
      return;
    }

    setIsRemoving(episodeId);
    try {
      const response = await fetch(`/api/episode/${episodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumId: null,
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error removing audio from album: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing audio from album:', error);
      alert('Failed to remove audio from album');
    } finally {
      setIsRemoving(null);
    }
  };

  if (episodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">🎵</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No episodes in this album</h3>
        <p className="text-gray-600 mb-4">
          This album is empty. Add episodes to get started.
        </p>
        <Link
              href="/my/submit/episode"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Submit Episode
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio Files List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Audio Files ({episodes.length})
            </h3>
            <Link
              href={`/my/submit/episode?album=${album.id}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              + Add More Audio
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {episodes.map((audio) => (
            <div key={audio.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-gray-800 truncate">
                      {audio.title}
                    </h5>
                    <span className={getStatusBadge(audio.status as any)}>
                      {audio.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Original: {audio.originalName}</div>
                    {audio.language && (
                      <div>Language: {audio.language}</div>
                    )}
                    {audio.description && (
                      <div>Description: {audio.description}</div>
                    )}
                    {audio.originalWebsite && (
                      <div>
                        Website: 
                        <a 
                          href={audio.originalWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline ml-1"
                        >
                          {audio.originalWebsite}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <span>Format: {audio.format.toUpperCase()}</span>
                      <span>Size: {formatFileSize(audio.fileSize)}</span>
                      {audio.duration && (
                        <span>Duration: {formatDuration(audio.duration)}</span>
                      )}
                    </div>
                    <div>Uploaded: {formatDate(audio.createdAt.toISOString())}</div>
                    
                    {/* Display Labels */}
                    {audio.labels && audio.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-400">Labels:</span>
                        {audio.labels.map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/episode/${audio.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleRemoveFromAlbum(audio.id)}
                    disabled={isRemoving === audio.id}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                  >
                    {isRemoving === audio.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Album Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Album Actions</h3>
        <div className="flex items-center space-x-4">
          <Link
            href="/albums"
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            ← Back to Albums
          </Link>
          <Link
            href={`/albums/${album.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Edit Album
          </Link>
        </div>
      </div>
    </div>
  );
}
