// AlbumForm.tsx

'use client';

import { useState } from 'react';
import { Album, } from '@/types/audio';

interface AlbumFormProps {
  editingAlbum: Album | null;

  onCreate: (albumData: any) => void;
  onUpdate: (albumData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function AlbumForm({
  editingAlbum,
  onCreate,
  onUpdate,
  onCancel,
  isLoading,
}: AlbumFormProps) {
  const [albumName, setAlbumName] = useState(editingAlbum?.name || '');
  const [albumDescription, setAlbumDescription] = useState(editingAlbum?.description || '');
  const [albumColor, setAlbumColor] = useState(editingAlbum?.color || '#3B82F6');

  const handleSubmit = () => {
    const albumData = {
      name: albumName.trim(),
      description: albumDescription.trim() || undefined,
      color: albumColor,
    };
    
    if (editingAlbum) {
      onUpdate(albumData);
    } else {
      onCreate(albumData);
    }
  };

  return (
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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

    


        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={albumDescription}
            onChange={(e) => setAlbumDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Describe the album..."
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={!albumName.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md"
        >
          {editingAlbum ? 'Update Album' : 'Create Album'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}