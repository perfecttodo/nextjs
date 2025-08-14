'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioStatus } from '@/types/audio';

interface AudioRecorderProps {
  defaultTitle?: string;
  defaultStatus?: AudioStatus;
  onUploaded?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export default function AudioRecorder({
  defaultTitle = 'New recording',
  defaultStatus = 'draft',
  onUploaded,
}: AudioRecorderProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<AudioStatus>(defaultStatus);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentSize, setCurrentSize] = useState(0);
  const [mimeType, setMimeType] = useState('');

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [recordingUrl]);

  const getSupportedMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm'; // default fallback
  };

  const startRecording = async () => {
    try {
      setError('');
      setCurrentSize(0);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const detectedMimeType = getSupportedMimeType();
      setMimeType(detectedMimeType);
      
      const options = detectedMimeType ? { mimeType: detectedMimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          const newSize = currentSize + e.data.size;
          setCurrentSize(newSize);

          // Create a playable version of the current recording
          try {
            const blob = new Blob([...chunksRef.current], { type: detectedMimeType });
            setRecordingBlob(blob);
            setRecordingUrl(URL.createObjectURL(blob));
          } catch (err) {
            console.error('Error creating blob:', err);
          }

          if (newSize >= MAX_SIZE_BYTES) {
            stopRecording();
          }
        }
      };

      // Use larger timeslice (5 seconds) for better chunk integrity
      recorder.start(5000);
      setIsRecording(true);
    } catch (e) {
      setError('Microphone permission denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.requestData(); // Request final chunk
      recorderRef.current.stop();
    }
  };

  const finalizeRecording = () => {
    if (chunksRef.current.length === 0) return;

    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordingBlob(blob);
      setRecordingUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Error finalizing recording:', err);
      setError('Failed to create audio file');
    }
  };

  const uploadRecording = async () => {
    if (!recordingBlob) return;
    
    try {
      setIsUploading(true);
      setError('');
      
      const form = new FormData();
      const ext = mimeType.includes('ogg') ? 'ogg' :
                 mimeType.includes('mp4') ? 'm4a' :
                 mimeType.includes('wav') ? 'wav' : 'webm';
      
      const filename = `recording_${Date.now()}.${ext}`;
      const file = new File([recordingBlob], filename, { type: mimeType });
      
      form.append('file', file);
      form.append('title', title.trim() || 'New recording');
      form.append('status', status);

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      if (onUploaded) onUploaded();
      resetRecorder();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecorder = () => {
    setRecordingBlob(null);
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    setTitle('New recording');
    setCurrentSize(0);
    chunksRef.current = [];
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Record Audio</h3>
      {error && (
        <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded mb-3">
          {error}
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        {!isRecording ? (
          <button 
            onClick={startRecording} 
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording} 
            className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Stop Recording
          </button>
        )}
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as AudioStatus)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {isRecording && (
        <div className="mb-3 text-sm text-gray-600">
          <div>Recording: {formatFileSize(currentSize)} / {formatFileSize(MAX_SIZE_BYTES)}</div>
          <div>Format: {mimeType}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (currentSize / MAX_SIZE_BYTES) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {recordingUrl && (
        <div className="space-y-2 mb-3">
          <audio 
            controls 
            src={recordingUrl} 
            className="w-full"
            onError={(e) => console.error('Audio playback error:', e)}
          />
          <div className="text-xs text-gray-500">
            Type: {mimeType} | Size: {formatFileSize(recordingBlob?.size || 0)}
          </div>
        </div>
      )}

      <button
        disabled={!recordingBlob || isUploading}
        onClick={uploadRecording}
        className={`px-3 py-2 rounded ${
          !recordingBlob || isUploading 
            ? 'bg-gray-300 text-gray-600' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Recording'}
      </button>
    </div>
  );
}