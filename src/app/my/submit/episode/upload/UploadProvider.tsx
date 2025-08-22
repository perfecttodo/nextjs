'use client';

import { useState, useRef, useEffect } from 'react';

interface UploadProvider {
  onSuccess: (blob: Blob) => void;
}

export default function AudioUpload({
  onSuccess: onSuccess,
}: UploadProvider) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Clean up audio element when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.src = '';
      }
    };
  }, []);

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

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      
      audioRef.current.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audioRef.current?.duration || 0);
      };
      
      audioRef.current.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio file'));
      };
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only MP3, x-m4a, WAV, and OGG files are allowed.');
      return;
    }
  
    // Validate file size (max 30MB)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 30MB.');
      return;
    }
  
    setIsLoading(true);
    setError('');
    
    try {
      // Get audio duration
      const duration = await getAudioDuration(file);
      setAudioDuration(duration);
      
      setSelectedFile(file);
      
      // Call onSuccess with the file as a Blob
      onSuccess(new Blob([file], { type: file.type }));
    } catch (err) {
      setError('Failed to process audio file. Please try another file.');
      console.error('Error processing audio:', err);
    } finally {
      setIsLoading(false);
    }
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileFormat = (file: File) => {
    return file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-3">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">⏳</div>
            <div className="text-gray-600">Processing audio file...</div>
          </div>
        ) : selectedFile ? (
          <div className="space-y-3">
            <div className="text-green-600 text-lg">✓ File Selected</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="font-medium">{selectedFile.name}</div>
              <div className="flex justify-center gap-4 text-xs">
                <div>
                  <span className="font-semibold">Size:</span> {formatFileSize(selectedFile.size)}
                </div>
                <div>
                  <span className="font-semibold">Format:</span> {getFileFormat(selectedFile)}
                </div>
                {audioDuration !== null && (
                  <div>
                    <span className="font-semibold">Duration:</span> {formatDuration(audioDuration)}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setAudioDuration(null);
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
              MP3, x-m4a, WAV, OGG up to 30MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}