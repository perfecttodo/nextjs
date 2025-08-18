'use client';

import { useState, useEffect } from 'react';
import { Album, Category, Group } from '@/types/audio';
import Link from 'next/link';

interface AlbumManagementClientProps {
  userId: string;
}

export default function AlbumManagementClient({ userId }: AlbumManagementClientProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  
  // Form state
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [albumColor, setAlbumColor] = useState('#3B82F6');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch albums
      const albumsResponse = await fetch(`/api/episode/albums?ownerId=${userId}`);
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setAlbums(albumsData.albums || []);
      }




    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) return;

    try {
      const response = await fetch('/api/episode/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: albumName.trim(),
          description: albumDescription.trim() || undefined,
          categoryId: selectedCategoryId || undefined,
          ownerId: userId,
          color: albumColor
        }),
      });

      if (response.ok) {
        const newAlbum = await response.json();
        setAlbums(prev => [newAlbum, ...prev]);
        resetForm();
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(`Error creating album: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album');
    }
  };

  const handleUpdateAlbum = async () => {
    if (!editingAlbum || !albumName.trim()) return;

    try {
      const response = await fetch(`/api/episode/albums/${editingAlbum.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: albumName.trim(),
          description: albumDescription.trim() || undefined,
          categoryId: selectedCategoryId || undefined,
          groupId: selectedGroupId || undefined,
          color: albumColor
        }),
      });

      if (response.ok) {
        const updatedAlbum = await response.json();
        setAlbums(prev => prev.map(album => 
          album.id === editingAlbum.id ? updatedAlbum : album
        ));
        resetForm();
        setEditingAlbum(null);
      } else {
        const error = await response.json();
        alert(`Error updating album: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Failed to update album');
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/episode/albums/${albumId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlbums(prev => prev.filter(album => album.id !== albumId));
      } else {
        const error = await response.json();
        alert(`Error deleting album: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album');
    }
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setAlbumName(album.name);
    setAlbumDescription(album.description || '');
    setSelectedCategoryId(album.categoryId || '');
    setSelectedGroupId(album.groupId || '');
    setAlbumColor(album.color || '#3B82F6');
  };

  const resetForm = () => {
    setAlbumName('');
    setAlbumDescription('');
    setSelectedCategoryId('');
    setSelectedGroupId('');
    setSelectedSubcategoryId('');
    setAlbumColor('#3B82F6');
  };

  const cancelEdit = () => {
    setEditingAlbum(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading albums...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(showCreateForm || editingAlbum) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingAlbum ? 'Edit Album' : 'Create New Album'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Album Name *
              </label>
              <input
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter album name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={albumColor}
                onChange={(e) => setAlbumColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedCategoryId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory (Optional)</label>
                <select
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Subcategory</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group (Optional)
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Personal</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={albumDescription}
                onChange={(e) => setAlbumDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the album..."
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={editingAlbum ? handleUpdateAlbum : handleCreateAlbum}
              disabled={!albumName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingAlbum ? 'Update Album' : 'Create Album'}
            </button>
            <button
              onClick={editingAlbum ? cancelEdit : () => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Albums List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Your Albums ({albums.length})
            </h3>
            {!showCreateForm && !editingAlbum && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                + New Album
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {albums.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No albums yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first album to start organizing your audio files
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Create Your First Album
              </button>
            </div>
          ) : (
            albums.map((album) => (
              <div key={album.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: album.color || '#3B82F6' }}
                    ></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {album.name}
                        </h4>
                        {album.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {album.category.name}
                          </span>
                        )}
                        {album.group && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {album.group.name}
                          </span>
                        )}
                      </div>
                      {album.description && (
                        <p className="text-sm text-gray-600 mt-1">{album.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {album._count?.episodes || 0} audio files • Created {new Date(album.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/albums/${album.id}`}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      View Episodes
                    </Link>
                    <button
                      onClick={() => handleEdit(album)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAlbum(album.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
