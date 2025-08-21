'use client';

import { useState, useEffect } from 'react';
import { AudioStatus, Episode } from '../../../../types/audio';
import AudioFormFields from '../../../components/upload/AudioFormFields';
import { useUser } from '../../../hooks/useUser';
import PlayButton from '../../../components/PlayButton';
import { formatDate,formatDuration,formatFileSize } from '@/lib/audio';

interface CategorizedAudioManagementProps {
  onRefresh: () => void;
}


export default function UserEpisodeManagement({ onRefresh }: CategorizedAudioManagementProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editStatus, setEditStatus] = useState<AudioStatus>('draft');
  const [editLanguage, setEditLanguage] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editOriginalWebsite, setEditOriginalWebsite] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [album,setAlbum] =useState('');

  const { user, loading: userLoading } = useUser();


  useEffect(() => {
    

    fetchAudioFiles();
  }, [filter]);



  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/episode/manage?${params}`);
      if (!response.ok) throw new Error('Failed to fetch episodes');

      const data = await response.json();
      setEpisodes(data.episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (audio: Episode) => {
    setEditingId(audio.id);
    setEditTitle(audio.title);
    setEditUrl(audio.blobUrl);
    setEditStatus(audio.status);
    setEditLanguage(audio.language || '');
    setEditDescription(audio.description || '');
    setEditOriginalWebsite(audio.originalWebsite || '');
    setAlbum(audio?.album?.id||'');
  };

  const handleSave = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      const response = await fetch('/api/episode/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: editTitle.trim(),
          status: editStatus,
          language: editLanguage || null,
          description: editDescription || null,
          originalWebsite: editOriginalWebsite || null,
          albumId:album||null
        }),
      });

      if (!response.ok) throw new Error('Failed to update audio file');

      setEditingId(null);
      setEditTitle('');
      setEditStatus('draft');
      setEditLanguage('');
      setEditDescription('');
      setEditOriginalWebsite('');
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
      const response = await fetch(`/api/episode/manage?id=${id}`, {
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





 

  const getStatusBadge = (status: AudioStatus) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    if (status === 'published') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  if (loading ) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading episodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">My Episodes</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'draft' | 'published')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Episodes</option>
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

      {episodes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎵</div>
          <p className="text-gray-500">No episodes found</p>
        </div>
      ) : (
        <div className="space-y-8">
              {/* Episodes in this Category */}
              <div className="divide-y divide-gray-100">
                {episodes.map((audio) => (
                  <div
                    key={audio.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    {editingId === audio.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <AudioFormFields
                          audio={{
                            title: editTitle,
                            url: editUrl,
                            status: editStatus,
                            language: editLanguage,
                            description: editDescription,
                            originalWebsite: editOriginalWebsite,
                            albumId: album,
                          }}
                          onChange={(patch) => {
                            if (patch.title !== undefined) setEditTitle(patch.title);
                            if (patch.url !== undefined) setEditUrl(patch.url);
                            if (patch.status !== undefined) setEditStatus(patch.status);
                            if (patch.language !== undefined) setEditLanguage(patch.language);
                            if (patch.description !== undefined) setEditDescription(patch.description);
                            if (patch.originalWebsite !== undefined) setEditOriginalWebsite(patch.originalWebsite);
                            if (patch.albumId !== undefined) setAlbum(patch.albumId);
                          }}
                          showStatusHelp={false}
                          ownerId={user?.id}
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
                              <div>Album: {audio?.album?.name}</div>
                                              
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

                            <PlayButton episode={audio} episodes={episodes}/>
                          
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
        </div>
      )}
    </div>
  );
}
