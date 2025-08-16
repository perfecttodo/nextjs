'use client';

import { AudioStatus } from '@/types/audio';
import CategorySelector from './CategorySelector';

interface AudioFormFieldsProps {
  title: string;
  status: AudioStatus;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  categoryRequired?: boolean;
  showStatusHelp?: boolean;
}

export default function AudioFormFields({
  title,
  status,
  selectedCategoryId,
  selectedSubcategoryId,
  onTitleChange,
  onStatusChange,
  onCategoryChange,
  onSubcategoryChange,
  categoryRequired = true,
  showStatusHelp = true
}: AudioFormFieldsProps) {
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

      {/* Category Selection */}
      <CategorySelector
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategoryChange={onCategoryChange}
        onSubcategoryChange={onSubcategoryChange}
        required={categoryRequired}
      />
    </div>
  );
}
