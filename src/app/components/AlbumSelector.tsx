'use client';

import { useState, useEffect } from 'react';
import { Album } from '@/types/audio';
import AlbumForm from './AlbumForm'; // Import AlbumForm

interface AlbumSelectorProps {
  selectedAlbumId: string;
  onAlbumChange: (albumId: string) => void;
  ownerId?: string;
}

export default function AlbumSelector({
  onAlbumChange,
  selectedAlbumId,
  ownerId
}: AlbumSelectorProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch albums based on group (category is optional)
  useEffect(() => {
    if (!ownerId) return;

    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          ownerId: ownerId
        });
        
       

        const response = await fetch(`/api/episode/albums?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.albums || []);
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [ ownerId]);

  const handleCreateAlbum = async (albumData: any) => {
    if (!ownerId) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/episode/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...albumData,
          ownerId: ownerId
        }),
      });

      if (response.ok) {
        const newAlbum = await response.json();
        setAlbums(prev => [newAlbum, ...prev]);
        onAlbumChange(newAlbum.id);
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        alert(`Error creating album: ${errorData.error}`);
      }
    } catch (error) {
      alert('Failed to create album');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAlbumChange = (albumId: string) => {
    onAlbumChange(albumId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Album</label>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showCreateForm ? 'Cancel' : '+ New Album'}
        </button>
      </div>

      {/* Create New Album Form */}
      {showCreateForm && (
        <AlbumForm
          editingAlbum={null} // No album is being edited
          onCreate={handleCreateAlbum}
          onUpdate={() => {}} // Not used, but required
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      {/* Album Selection */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading albums...</div>
        ) : albums.length === 0 ? (
          <div className="text-sm text-gray-500">
            No albums found. Create one above or audio will be assigned to a default album.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Default "Single" album option */}
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="album"
                value=""
                checked={selectedAlbumId === ''}
                onChange={() => handleAlbumChange('')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Single (Default)</div>
                <div className="text-xs text-gray-500">Individual audio file</div>
              </div>
            </label>

            {/* Existing albums */}
            {albums.map((album) => (
              <label key={album.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="album"
                  value={album.id}
                  checked={selectedAlbumId === album.id}
                  onChange={() => handleAlbumChange(album.id)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{album.name}</div>
                  {album.description && (
                    <div className="text-xs text-gray-500">{album.description}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {album.group ? `Group: ${album.group.name}` : 'Personal'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}