'use client';

import { useEffect, useState } from 'react';

interface AudioUrlUploadProps {
  onSuccess: (url:string) => void;

}

export default function AudioUrlUpload({
  onSuccess
}: AudioUrlUploadProps) {
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

 
  async function detectUrl(url:string){
    setAudioUrl(url);
    onSuccess('');
    setError('')
    if(!url.trim())return;

    try {
      const response = await fetch(`/api/episode/detect?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if(data.success){
       return  onSuccess(url);
      }
    } catch (error) {
     
    } finally {
    }
    setError('format not support.')
  }
  return (
    <div>
      <div>
        <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Audio URL *
        </label>
        <input
          type="url"
          id="audioUrl"
          value={audioUrl}
          onChange={(e) => detectUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/audio.mp3"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: MP3, M4A, WAV, OGG
        </p>
      </div>

   

      {/* Error and Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
      </div>
  );
}