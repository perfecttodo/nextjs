'use client';

import { useState } from 'react';
import { AudioStatus, Label } from '../../types/audio';
import AudioFormFields from './AudioFormFields';

interface AudioUrlUploadProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedLabels: Label[]; // Added
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onLabelsChange: (labels: Label[]) => void; // Added
  onUploadSuccess: () => void;
}

export default function AudioUrlUpload({
  title,
  status,
  language,
  description,
  originalWebsite,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedLabels, // Added
  onTitleChange,
  onStatusChange,
  onLanguageChange,
  onDescriptionChange,
  onOriginalWebsiteChange,
  onCategoryChange,
  onSubcategoryChange,
  onLabelsChange, // Added
  onUploadSuccess
}: AudioUrlUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateUrl = (url: string) => {
    try {
      return true;
      const parsedUrl = new URL(url);
      const allowedExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.mp4','m3u8','audio/mpeg'];
      const hasValidExtension = allowedExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      return hasValidExtension;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioUrl || !title.trim()) {
      setError('Please enter a valid URL and title.');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category.');
      return;
    }

    if (!validateUrl(audioUrl)) {
      setError('Please enter a valid audio URL (MP3, M4A, WAV, or OGG).');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/audio/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: audioUrl,
          title: title.trim(),
          status,
          language: language || null,
          description: description || null,
          originalWebsite: originalWebsite || null,
          categoryId: selectedCategoryId,
          subcategoryId: selectedSubcategoryId || null,
          labelIds: selectedLabels.map(label => label.id), // Added
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess('Audio URL submitted successfully!');
      onTitleChange('');
      setAudioUrl('');
      onStatusChange('draft');
      onLanguageChange('');
      onDescriptionChange('');
      onOriginalWebsiteChange('');
      onCategoryChange('');
      onSubcategoryChange('');
      onLabelsChange([]); // Added - reset labels
      
      // Call the success callback to refresh the audio list
      onUploadSuccess();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Audio URL *
        </label>
        <input
          type="url"
          id="audioUrl"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/audio.mp3"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: MP3, M4A, WAV, OGG
        </p>
      </div>

      {/* Common Form Fields */}
      <AudioFormFields
        title={title}
        status={status}
        language={language}
        description={description}
        originalWebsite={originalWebsite}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedLabels={selectedLabels} // Added
        onTitleChange={onTitleChange}
        onStatusChange={onStatusChange}
        onLanguageChange={onLanguageChange}
        onDescriptionChange={onDescriptionChange}
        onOriginalWebsiteChange={onOriginalWebsiteChange}
        onCategoryChange={onCategoryChange}
        onSubcategoryChange={onSubcategoryChange}
        onLabelsChange={onLabelsChange} // Added
        categoryRequired={true}
        showStatusHelp={true}
      />

      {/* Error and Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 text-sm">{success}</div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || !audioUrl || !title.trim() || !selectedCategoryId}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isUploading || !audioUrl || !title.trim() || !selectedCategoryId
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isUploading ? 'Submitting...' : 'Submit Audio URL'}
      </button>
    </form>
  );
}