import React from 'react';
import { formatFileSize, formatDuration } from '@/lib/audio';

interface AudioPlayerProps {
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  outputFormat: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioBlob,
  duration,
  outputFormat,
}) => {
  if (!audioUrl) return null;

  return (
    <div className="space-y-2">
      <audio controls src={audioUrl} className="w-full" loop />
      <div className="text-xs text-gray-500">
        Type: {audioBlob?.type || 'unknown'} |
        Size: {audioBlob ? formatFileSize(audioBlob.size) : 'unknown'} |
        Duration: {formatDuration(duration)} |
        Format: {outputFormat.toUpperCase()}
      </div>
    </div>
  );
};