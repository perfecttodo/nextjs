'use client';

import { useState, useRef } from 'react';
import { AudioFormat, AudioStatus, Label } from '../../types/audio';
import AudioFormFields from './AudioFormFields';

interface AudioUploadProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedGroupId: string;
  selectedAlbumId: string;
  selectedLabels: Label[];
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onGroupChange: (groupId: string) => void;
  onAlbumChange: (albumId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  onUploadSuccess: () => void;
}

export default function AudioUpload({
  title,
  status,
  language,
  description,
  originalWebsite,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedGroupId,
  selectedAlbumId,
  selectedLabels,
  onTitleChange,
  onStatusChange,
  onLanguageChange,
  onDescriptionChange,
  onOriginalWebsiteChange,
  onCategoryChange,
  onSubcategoryChange,
  onGroupChange,
  onAlbumChange,
  onLabelsChange,
  onUploadSuccess
}: AudioUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mp4','audio/x-m4a','audio/m4a',  'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only MP3, x-m4a, WAV, and OGG files are allowed.');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 4 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 4MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Auto-generate title from filename if not set
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      onTitleChange(fileName);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) {
      setError('Please select a file and enter a title.');
      return;
    }



    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('status', status);
      if (language) formData.append('language', language);
      if (description) formData.append('description', description);
      if (originalWebsite) formData.append('originalWebsite', originalWebsite);
      if (selectedCategoryId) {
        formData.append('categoryId', selectedCategoryId);
      }
      if (selectedSubcategoryId) {
        formData.append('subcategoryId', selectedSubcategoryId);
      }
      if (selectedGroupId) {
        formData.append('groupId', selectedGroupId);
      }
      if (selectedAlbumId) {
        formData.append('albumId', selectedAlbumId);
      }
      // Add label IDs
      selectedLabels.forEach(label => {
        formData.append('labelIds', label.id);
      });

      const response = await fetch('/api/episode/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess('Audio file uploaded successfully!');
      onTitleChange('');
      setSelectedFile(null);
      onStatusChange('draft');
      onLanguageChange('');
      onDescriptionChange('');
      onOriginalWebsiteChange('');
      onCategoryChange('');
      onSubcategoryChange('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audio File
        </label>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".m4a,audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-green-600 text-lg">✓ File Selected</div>
              <div className="text-sm text-gray-600">
                <div>{selectedFile.name}</div>
                <div>{formatFileSize(selectedFile.size)}</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-gray-400 text-4xl">🎵</div>
              <div className="text-gray-600">
                <span 
                  className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Click to upload
                </span>{' '}
                or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                MP3, x-m4a, WAV, OGG up to 4MB
              </div>
            </div>
          )}
        </div>
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
        selectedGroupId={selectedGroupId}
        selectedAlbumId={selectedAlbumId}
        selectedLabels={selectedLabels}
        onTitleChange={onTitleChange}
        onStatusChange={onStatusChange}
        onLanguageChange={onLanguageChange}
        onDescriptionChange={onDescriptionChange}
        onOriginalWebsiteChange={onOriginalWebsiteChange}
        onCategoryChange={onCategoryChange}
        onSubcategoryChange={onSubcategoryChange}
        onGroupChange={onGroupChange}
        onAlbumChange={onAlbumChange}
        onLabelsChange={onLabelsChange}
        categoryRequired={false}
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
        disabled={isUploading || !selectedFile || !title.trim()}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isUploading || !selectedFile || !title.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Audio'}
      </button>
    </form>
  );
}