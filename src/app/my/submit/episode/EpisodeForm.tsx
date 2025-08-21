'use client';

import { AudioStatus } from '@/types/audio';

import AlbumSelector from '../../../components/AlbumSelector';

interface AudioFields {
  id:string,
  title: string;
  blobUrl: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  albumId: string;
  format?: string;
}

interface EpisodeFormProps {
  audio: AudioFields;
  onChange: (patch: Partial<AudioFields>) => void;
  showStatusHelp?: boolean;
  ownerId?: string;
}

export default function EpisodeForm({
  audio,
  onChange,
  showStatusHelp = true,
  ownerId
}: EpisodeFormProps) {
  console.log('ownerId', ownerId);
  return (
    <div className="space-y-6">

       {audio.id&&(<div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          URL
        </label>
        <input
          type="text"
          id="url"
          value={audio.blobUrl || ''}
          onChange={(e) => onChange({ blobUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g."
        />
      </div>)} 

      {/* Format Selection/Input */}
      <div>
        <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
          Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            id="format"
            value={audio.format || ''}
            onChange={(e) => onChange({ format: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Auto-detect</option>
            <option value="mp3">MP3</option>
            <option value="m4a">M4A</option>
            <option value="wav">WAV</option>
            <option value="ogg">OGG</option>
            <option value="m3u8">M3U8</option>
            <option value="flv">FLV</option>
            <option value="mpd">MPD</option>
          </select>
          <input
            type="text"
            placeholder="Or type custom (e.g., webm)"
            value={audio.format || ''}
            onChange={(e) => onChange({ format: e.target.value.toLowerCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave empty to detect from URL or filename.</p>
      </div>

      {/* Language Input */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <input
          type="text"
          id="language"
          value={audio.language || ''}
          onChange={(e) => onChange({ language: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., English, Spanish"
        />
      </div>
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={audio.title}
          onChange={(e) => onChange({ title: e.target.value })}
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
          value={audio.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
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
          value={audio.originalWebsite || ''}
          onChange={(e) => onChange({ originalWebsite: e.target.value })}
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
          value={audio.status}
          onChange={(e) => onChange({ status: e.target.value as AudioStatus })}
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
        selectedAlbumId={audio.albumId}
        onAlbumChange={(albumId) => onChange({ albumId })}
        ownerId={ownerId}
      />
    </div>
  );
}
