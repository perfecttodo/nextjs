// AlbumManagementClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { Album} from '@/types/audio';
import Link from 'next/link';
import AlbumForm from './AlbumForm';

interface AlbumManagementClientProps {
  userId: string;
}

export default function AlbumManagementClient({ userId }: AlbumManagementClientProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  
  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const albumsResponse = await fetch(`/api/albums?ownerId=${userId}`);
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setAlbums(albumsData.albums || []);
      }
      // Fetch categories and groups if needed
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlbum = async (albumData: any) => {
    if (!albumData.name) return;

    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...albumData,
          ownerId: userId,
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

  const handleUpdateAlbum = async (albumData: any) => {
    if (!editingAlbum) return;

    try {
      const response = await fetch(`/api/albums/${editingAlbum.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(albumData),
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
      const response = await fetch(`/api/albums/${albumId}`, {
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
  };

  const resetForm = () => {
    setEditingAlbum(null);
    setShowCreateForm(false);
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
      {(showCreateForm || editingAlbum) && (
        <AlbumForm
          editingAlbum={editingAlbum}
          onCreate={handleCreateAlbum}
          onUpdate={handleUpdateAlbum}
          onCancel={resetForm}
          isLoading={isLoading}
        />
      )}

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
                Create your first album to start organizing your episodes
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
                        {album._count?.episodes || 0} episodes • Created {new Date(album.createdAt).toLocaleDateString()}
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