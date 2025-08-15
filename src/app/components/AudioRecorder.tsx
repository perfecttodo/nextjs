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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export default function AudioRecorder({
  defaultTitle = 'New recording',
  defaultStatus = 'draft',
  onUploaded,
}: AudioRecorderProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<AudioStatus>(defaultStatus);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentSize, setCurrentSize] = useState(0);
  const curSizeRef = useRef(0);
  const [duration, setDuration] = useState(0); // Duration in seconds

  useEffect(() => {
    return () => {
      // Cleanup
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [recordingUrl]);

  const getSupportedMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4', // Safari
      'audio/webm',
      'audio/ogg',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    if (isRecording) return; // Prevent starting a new recording if already recording

    try {
      setError('');
      setCurrentSize(0);
      curSizeRef.current = 0;
      setDuration(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          curSizeRef.current += e.data.size;
          setCurrentSize(curSizeRef.current);
          
          if (curSizeRef.current >= MAX_SIZE_BYTES) {
            // Request the final chunk and stop
            recorder.requestData();
            recorder.stop(); // Stop recording here to ensure it captures the final data
            return;
          }
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setIsRecording(false);
        
        // Stop duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      // Start duration timer
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      recorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (e) {
      setError('Microphone permission denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.requestData();
      recorderRef.current.stop();
    }
  };

  const uploadRecording = async () => {
    if (!recordingBlob) return;
    try {
      setIsUploading(true);
      setError('');
      const form = new FormData();
      const ext = recordingBlob.type.includes('ogg')
        ? 'ogg'
        : recordingBlob.type.includes('mp4') || recordingBlob.type.includes('m4a')
        ? 'm4a'
        : recordingBlob.type.includes('wav')
        ? 'wav'
        : 'webm';
      const file = new File([recordingBlob], `recording.${ext}`, { type: recordingBlob.type });
      form.append('file', file);
      form.append('title', title.trim() || 'New recording');
      form.append('status', status);
      form.append('duration', duration.toString());

      const res = await fetch('/api/audio/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (onUploaded) onUploaded();
      
      // Reset
      setRecordingBlob(null);
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      setTitle('New recording');
      curSizeRef.current = 0;
      setCurrentSize(0);
      setDuration(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Record Audio</h3>
      {error && (
        <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded mb-3">{error}</div>
      )}
      <div className="flex items-center gap-3 mb-3">
        {!isRecording ? (
          <button onClick={startRecording} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white">
            Stop Recording
          </button>
        )}
        <div className='grid gap-3'>
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
      </div>

      {/* Show current size and duration during recording */}
      {isRecording && (
        <div className="mb-3 text-sm text-gray-600">
          <div>Duration: {formatDuration(duration)}</div>
          <div>Recording: {formatFileSize(currentSize)} / {formatFileSize(MAX_SIZE_BYTES)}</div>
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
          <audio controls src={recordingUrl} className="w-full" />
          <div className="text-xs text-gray-500">
            Type: {recordingBlob?.type || 'unknown'} | 
            Size: {recordingBlob ? formatFileSize(recordingBlob.size) : 'unknown'} |
            Duration: {formatDuration(duration)}
          </div>
        </div>
      )}

      <button
        disabled={!recordingBlob || isUploading}
        onClick={uploadRecording}
        className={`px-3 py-2 rounded ${!recordingBlob || isUploading ? 'bg-gray-300 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {isUploading ? 'Uploading...' : 'Upload Recording'}
      </button>
    </div>
  );
}