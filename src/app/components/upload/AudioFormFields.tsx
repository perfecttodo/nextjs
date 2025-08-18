'use client';

import { AudioStatus, Label } from '@/types/audio';

import AlbumSelector from '../AlbumSelector';

interface AudioFormFieldsProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedLabels: Label[];
  selectedGroupId: string;
  selectedAlbumId: string;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onLabelsChange: (labels: Label[]) => void;
  onGroupChange: (groupId: string) => void;
  onAlbumChange: (albumId: string) => void;
  categoryRequired?: boolean;
  showStatusHelp?: boolean;
  ownerId?: string;
}

export default function AudioFormFields({
  title,
  status,
  description,
  originalWebsite,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedGroupId,
  selectedAlbumId,
  onTitleChange,
  onStatusChange,
  onDescriptionChange,
  onOriginalWebsiteChange,
  onAlbumChange,
  categoryRequired = false,
  showStatusHelp = true,
  ownerId
}: AudioFormFieldsProps) {
  console.log('ownerId', ownerId);
  console.log('ownerId', ownerId);
  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter audio title"
          required
        />
      </div>



      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the audio content..."
        />
      </div>

      {/* Original Website Input */}
      <div>
        <label htmlFor="originalWebsite" className="block text-sm font-medium text-gray-700 mb-2">
          Website (Optional)
        </label>
        <input
          type="url"
          id="originalWebsite"
          value={originalWebsite || ''}
          onChange={(e) => onOriginalWebsiteChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com"
        />
      </div>

      {/* Status Selection */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as AudioStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        {showStatusHelp && (
          <p className="text-xs text-gray-500 mt-1">
            Draft files are only visible to you. Published files are visible to everyone.
          </p>
        )}
      </div>



      {/* Album Selection */}
      <AlbumSelector
        selectedAlbumId={selectedAlbumId}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedGroupId={selectedGroupId}
        onAlbumChange={onAlbumChange}
        ownerId={ownerId}
      />
    </div>
  );
}
