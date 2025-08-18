'use client';

import { useState, useEffect } from 'react';
import { Album, Category, Group } from '@/types/audio';

interface AlbumSelectorProps {
  selectedAlbumId: string;
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedGroupId: string;
  onAlbumChange: (albumId: string) => void;
  ownerId?: string;
}

export default function AlbumSelector({
  selectedAlbumId,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedGroupId,
  onAlbumChange,
  ownerId
}: AlbumSelectorProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
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
        
        if (selectedCategoryId) {
          params.append('categoryId', selectedCategoryId);
        }
        if (selectedSubcategoryId) {
          params.append('subcategoryId', selectedSubcategoryId);
        }
        
        if (selectedGroupId) {
          params.append('groupId', selectedGroupId);
        }

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
  }, [selectedCategoryId, selectedSubcategoryId, selectedGroupId, ownerId]);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim() || !ownerId) return;

    setIsCreating(true);
    try {
      console.log('Creating album with data:', {
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        subcategoryId: selectedSubcategoryId || undefined,
        groupId: selectedGroupId || undefined,
        ownerId: ownerId
      });

      const response = await fetch('/api/episode/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim() || undefined,
          categoryId: selectedCategoryId || undefined,
          subcategoryId: selectedSubcategoryId || undefined,
          groupId: selectedGroupId || undefined,
          ownerId: ownerId
        }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const newAlbum = await response.json();
        console.log('Created album:', newAlbum);
        setAlbums(prev => [newAlbum, ...prev]);
        onAlbumChange(newAlbum.id);
        setNewAlbumName('');
        setNewAlbumDescription('');
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Error creating album: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating album:', error);
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
        <label className="block text-sm font-medium text-gray-700">
          Album
        </label>
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
          <div>
            <label htmlFor="newAlbumName" className="block text-xs font-medium text-blue-800 mb-1">
              Album Name *
            </label>
            <input
              type="text"
              id="newAlbumName"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter album name"
              maxLength={100}
            />
          </div>
          
          <div>
            <label htmlFor="newAlbumDescription" className="block text-xs font-medium text-blue-800 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="newAlbumDescription"
              value={newAlbumDescription}
              onChange={(e) => setNewAlbumDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Describe the album..."
              maxLength={500}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleCreateAlbum}
              disabled={!newAlbumName.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Album'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
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
