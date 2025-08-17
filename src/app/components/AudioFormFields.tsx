'use client';

import { AudioStatus, Label } from '@/types/audio';
import CategorySelector from './CategorySelector';
import LabelSelector from './LabelSelector';

interface AudioFormFieldsProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedLabels: Label[];
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  categoryRequired?: boolean;
  showStatusHelp?: boolean;
  ownerId?: string;
}

export default function AudioFormFields({
  title,
  status,
  language,
  description,
  originalWebsite,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedLabels,
  onTitleChange,
  onStatusChange,
  onLanguageChange,
  onDescriptionChange,
  onOriginalWebsiteChange,
  onCategoryChange,
  onSubcategoryChange,
  onLabelsChange,
  categoryRequired = true,
  showStatusHelp = true,
  ownerId
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

      {/* Language Input */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <input
          type="text"
          id="language"
          value={language || ''}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., English, Spanish, French"
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
          Original Website (Optional)
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

      {/* Category Selection */}
      <CategorySelector
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategoryChange={onCategoryChange}
        onSubcategoryChange={onSubcategoryChange}
        required={categoryRequired}
      />

      {/* Label Selection */}
      <LabelSelector
        selectedLabels={selectedLabels}
        onLabelsChange={onLabelsChange}
        ownerId={ownerId}
      />
    </div>
  );
}
