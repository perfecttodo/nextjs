'use client';

import { useState, useEffect } from 'react';
import { AudioFormat, AudioStatus,AudioFile } from '../../types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';


interface AudioManagementProps {
  onRefresh: () => void;
}

export default function AudioManagement({ onRefresh }: AudioManagementProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<AudioStatus>('draft');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const { setAudio,setAudioFiles:updateAudioFiles} = useAudioPlayerStore();

  useEffect(() => {
    fetchAudioFiles();
  }, [filter]);

  const onPlayAudio = (audio: AudioFile) => {
    setCurrentAudio(audio);
    setAudio(audio)
    updateAudioFiles(audioFiles);

  };

  
  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/audio/manage?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audio files');
      
      const data = await response.json();
      setAudioFiles(data.audioFiles);
    } catch (error) {
      console.error('Error fetching audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (audio: AudioFile) => {
    setEditingId(audio.id);
    setEditTitle(audio.title);
    setEditStatus(audio.status);
  };

  const handleSave = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      const response = await fetch('/api/audio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: editTitle.trim(),
          status: editStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update audio file');

      setEditingId(null);
      setEditTitle('');
      setEditStatus('draft');
      fetchAudioFiles();
      onRefresh();
    } catch (error) {
      console.error('Error updating audio file:', error);
      alert('Failed to update audio file');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditStatus('draft');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio file? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/audio/manage?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete audio file');

      fetchAudioFiles();
      onRefresh();
    } catch (error) {
      console.error('Error deleting audio file:', error);
      alert('Failed to delete audio file');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: AudioStatus) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    if (status === 'published') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading audio files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">My Audio Files</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'draft' | 'published')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Files</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
          <button
            onClick={fetchAudioFiles}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {audioFiles.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎵</div>
          <p className="text-gray-500">No audio files found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {audioFiles.map((audio) => (
            <div
              key={audio.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {editingId === audio.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as AudioStatus)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {audio.title}
                        </h4>
                        <span className={getStatusBadge(audio.status)}>
                          {audio.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Original: {audio.originalName}</div>
                        <div className="flex items-center space-x-4">
                          <span>Format: {audio.format.toUpperCase()}</span>
                          <span>Size: {formatFileSize(audio.fileSize)}</span>
                          {audio.duration && (
                            <span>Duration: {formatDuration(audio.duration)}</span>
                          )}
                        </div>
                        <div>Uploaded: {formatDate(audio.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(audio)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(audio.id)}
                        disabled={deletingId === audio.id}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === audio.id ? '🗑️' : '🗑️'}
                      </button>

                                    {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayAudio(audio);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          currentAudio?.id === audio.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title={currentAudio?.id === audio.id ? 'Currently Playing' : 'Play Audio'}
                      >
                        {currentAudio?.id === audio.id ? '⏸️' : '▶️'}
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
