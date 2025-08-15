'use client';

import { useState } from 'react';
import { AudioStatus } from '../../types/audio';

interface AudioUrlUploadProps {
  onUploadSuccess: () => void;
}

export default function AudioUrlUpload({ onUploadSuccess }: AudioUrlUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<AudioStatus>('draft');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const allowedExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.mp4','m3u8'];
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess('Audio URL submitted successfully!');
      setTitle('');
      setAudioUrl('');
      setStatus('draft');
      
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Submit Audio URL</h3>
      
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

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value as AudioStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Draft files are only visible to you. Published files are visible to everyone.
          </p>
        </div>

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
          disabled={isUploading || !audioUrl || !title.trim()}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isUploading || !audioUrl || !title.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUploading ? 'Submitting...' : 'Submit Audio URL'}
        </button>
      </form>
    </div>
  );
}