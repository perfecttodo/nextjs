'use client';

import { useState, useRef } from 'react';

interface UploadProvider {
  onSuccess: (blob:Blob) => void;
}

export default function AudioUpload({
  onSuccess: onSuccess,
}: UploadProvider) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
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
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only MP3, x-m4a, WAV, and OGG files are allowed.');
      return;
    }
  
    // Validate file size (max 30MB)
    const maxSize = 30* 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 4MB.');
      return;
    }
  
    setSelectedFile(file);
    setError('');
  
    // Call onSuccess with the file as a Blob
    onSuccess(new Blob([file], { type: file.type }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
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
                  {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
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

  );
}