'use client';

import { useState, useEffect } from 'react';
import { AudioStatus, AudioFile, Category, Label } from '../../types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import CategorySelector from './CategorySelector';
import AudioFormFields from './AudioFormFields';

interface CategorizedAudioManagementProps {
  onRefresh: () => void;
}

interface GroupedAudioFiles {
  [categoryId: string]: {
    category: Category;
    audioFiles: AudioFile[];
  };
}

export default function CategorizedAudioManagement({ onRefresh }: CategorizedAudioManagementProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<AudioStatus>('draft');
  const [editLanguage, setEditLanguage] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editOriginalWebsite, setEditOriginalWebsite] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editSubcategoryId, setEditSubcategoryId] = useState<string>('');
  const [editGroupId, setEditGroupId] = useState<string>('');
  const [editLabels, setEditLabels] = useState<Label[]>([]); // Added
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const { setAudio, setAudioFiles: updateAudioFiles, audio: currentAudio, togglePlay, isPlaying } = useAudioPlayerStore();

  useEffect(() => {
    fetchAudioFiles();
  }, [filter]);

  const onPlayAudio = (audio: AudioFile) => {
    if (currentAudio?.id === audio.id) {
      togglePlay();
    } else {
      setAudio(audio);
      updateAudioFiles(audioFiles);
    }
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
    setEditLanguage(audio.language || '');
    setEditDescription(audio.description || '');
    setEditOriginalWebsite(audio.originalWebsite || '');
    setEditCategoryId(audio.categoryId || '');
    setEditSubcategoryId(audio.subcategoryId || '');
    setEditGroupId(audio.groupId || '');
    setEditLabels(audio.labels || []); // Added
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
          language: editLanguage || null,
          description: editDescription || null,
          originalWebsite: editOriginalWebsite || null,
          categoryId: editCategoryId || null,
          subcategoryId: editSubcategoryId || null,
          groupId: editGroupId || null,
          labelIds: editLabels.map(label => label.id), // Added
        }),
      });

      if (!response.ok) throw new Error('Failed to update audio file');

      setEditingId(null);
      setEditTitle('');
      setEditStatus('draft');
      setEditLanguage('');
      setEditDescription('');
      setEditOriginalWebsite('');
      setEditCategoryId('');
      setEditSubcategoryId('');
      setEditLabels([]); // Added - reset labels
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
    setEditCategoryId('');
    setEditSubcategoryId('');
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

  // Group audio files by category
  const groupedAudioFiles: GroupedAudioFiles = {};

  audioFiles.forEach(audio => {
    if (audio.category) {
      const categoryId = audio.category.id;
      if (!groupedAudioFiles[categoryId]) {
        groupedAudioFiles[categoryId] = {
          category: audio.category,
          audioFiles: []
        };
      }
      groupedAudioFiles[categoryId].audioFiles.push(audio);
    } else {
      // Handle uncategorized files
      if (!groupedAudioFiles['uncategorized']) {
        groupedAudioFiles['uncategorized'] = {
          category: { id: 'uncategorized', name: 'Uncategorized', createdAt: '', updatedAt: '' },
          audioFiles: []
        };
      }
      groupedAudioFiles['uncategorized'].audioFiles.push(audio);
    }
  });

  // Sort categories by name
  const sortedCategories = Object.values(groupedAudioFiles).sort((a, b) => {
    if (a.category.name === 'Uncategorized') return 1;
    if (b.category.name === 'Uncategorized') return -1;
    return a.category.name.localeCompare(b.category.name);
  });

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
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
        <div className="space-y-8">
          {sortedCategories.map(({ category, audioFiles }) => (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <div 
                className="px-4 py-3 border-b border-gray-200 bg-gray-50"
                style={{
                  borderLeftColor: category.color || '#3B82F6',
                  borderLeftWidth: '4px'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {category.name}
                    </h4>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                      {audioFiles.length} {audioFiles.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-500">{category.description}</p>
                  )}
                </div>
              </div>

              {/* Audio Files in this Category */}
              <div className="divide-y divide-gray-100">
                {audioFiles.map((audio) => (
                  <div
                    key={audio.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    {editingId === audio.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <AudioFormFields
                          title={editTitle}
                          status={editStatus}
                          language={editLanguage}
                          description={editDescription}
                          originalWebsite={editOriginalWebsite}
                          selectedCategoryId={editCategoryId}
                          selectedSubcategoryId={editSubcategoryId}
                          selectedGroupId={editGroupId}
                          selectedLabels={editLabels} // Added
                          onTitleChange={setEditTitle}
                          onStatusChange={setEditStatus}
                          onLanguageChange={setEditLanguage}
                          onDescriptionChange={setEditDescription}
                          onOriginalWebsiteChange={setEditOriginalWebsite}
                          onCategoryChange={setEditCategoryId}
                          onSubcategoryChange={setEditSubcategoryId}
                          onGroupChange={setEditGroupId}
                          onLabelsChange={setEditLabels} // Added
                          categoryRequired={false}
                          showStatusHelp={false}
                        />
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
                              <h5 className="font-medium text-gray-800 truncate">
                                {audio.title}
                              </h5>
                              <span className={getStatusBadge(audio.status)}>
                                {audio.status}
                              </span>
                              {audio.subcategory && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {audio.subcategory.name}
                                </span>
                              )}
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
                                <div>Website: <a href={audio.originalWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{audio.originalWebsite}</a></div>
                              )}
                              <div className="flex items-center space-x-4">
                                <span>Format: {audio.format.toUpperCase()}</span>
                                <span>Size: {formatFileSize(audio.fileSize)}</span>
                                {audio.duration && (
                                  <span>Duration: {formatDuration(audio.duration)}</span>
                                )}
                              </div>
                              <div>Uploaded: {formatDate(audio.createdAt)}</div>
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
                              {currentAudio?.id === audio.id && isPlaying ? '⏸️' : '▶️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
