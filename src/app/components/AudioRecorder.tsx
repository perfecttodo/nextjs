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
  const accumulatedSizeRef = useRef(0); // Track size accurately with ref

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<AudioStatus>(defaultStatus);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentSize, setCurrentSize] = useState(0);
  const [mimeType, setMimeType] = useState('audio/webm');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      stopMediaTracks();
    };
  }, [recordingUrl]);

  const stopMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      mediaStreamRef.current = null;
    }
  };

  const getSupportedMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
    ];
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
  };

  const startRecording = async () => {
    try {
      setError('');
      accumulatedSizeRef.current = 0;
      setCurrentSize(0);
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const detectedMimeType = getSupportedMimeType();
      setMimeType(detectedMimeType);
      
      const recorder = new MediaRecorder(stream, { mimeType: detectedMimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          accumulatedSizeRef.current += e.data.size;
          setCurrentSize(accumulatedSizeRef.current);

          // Update the playable version
          try {
            const blob = new Blob([...chunksRef.current], { type: detectedMimeType });
            setRecordingBlob(blob);
            setRecordingUrl(URL.createObjectURL(blob));
          } catch (err) {
            console.error('Blob creation error:', err);
          }

          // Auto-stop only when reaching max size
          if (accumulatedSizeRef.current >= MAX_SIZE_BYTES) {
            stopRecording();
          }
        }
      };

      recorder.onstop = () => {
        finalizeRecording();
        setIsRecording(false);
        stopMediaTracks();
      };

      recorder.onerror = (e) => {
        console.error('Recorder error:', e);
        setError('Recording error occurred');
        setIsRecording(false);
        stopMediaTracks();
      };

      // Start with 500ms chunks for accurate size tracking
      recorder.start(500);
      setIsRecording(true);
    } catch (e) {
      console.error('Recording start error:', e);
      setError('Microphone access denied or not available');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || !isRecording) return;
    
    // Request final data
    recorderRef.current.requestData();
    
    // Stop after a small delay to ensure data is processed
    setTimeout(() => {
      if (recorderRef.current?.state !== 'inactive') {
        recorderRef.current?.stop();
      }
    }, 200);
  };

  const finalizeRecording = () => {
    if (chunksRef.current.length === 0) {
      setError('No recording data available');
      return;
    }

    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordingBlob(blob);
      setRecordingUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Finalization error:', err);
      setError('Failed to create audio file');
    }
  };

  const uploadRecording = async () => {
    if (!recordingBlob || isUploading) return;
    
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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      if (onUploaded) onUploaded();
      resetRecorder();
    } catch (e) {
      console.error('Upload error:', e);
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecorder = () => {
    setRecordingBlob(null);
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
    setTitle(defaultTitle);
    setCurrentSize(0);
    chunksRef.current = [];
    accumulatedSizeRef.current = 0;
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
         
          <div className="text-xs text-gray-500">
            Type: {mimeType} | Size: {formatFileSize(recordingBlob?.size || 0)}
          </div>
        </div>
      )}

      <button
        disabled={!recordingBlob || isUploading || isRecording}
        onClick={uploadRecording}
        className={`px-3 py-2 rounded ${
          !recordingBlob || isUploading || isRecording
            ? 'bg-gray-300 text-gray-600' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Recording'}
      </button>
    </div>
  );
}