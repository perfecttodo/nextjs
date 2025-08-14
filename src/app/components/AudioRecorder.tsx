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

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const CHUNK_DURATION_MS = 4000; // 4 seconds per chunk

export default function AudioRecorder({
  defaultTitle = 'New recording',
  defaultStatus = 'draft',
  onUploaded,
}: AudioRecorderProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<AudioStatus>(defaultStatus);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState(0);

  useEffect(() => {
    return () => {
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
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari && MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    }
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startMediaStream = async () => {
    if (!mediaStreamRef.current) {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  };

  const recordChunk = async () => {
    await startMediaStream();
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(mediaStreamRef.current!, mimeType ? { mimeType } : undefined);

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);

        // Merge for preview
        const merged = new Blob(chunksRef.current, { type: e.data.type });
        setRecordingBlob(merged);
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(merged));
      }
    };

    recorder.onstop = () => {
      if (isRecording) {
        // Schedule next chunk
        recordChunk();
      }
    };

    recorder.start();
    setTimeout(() => recorder.stop(), CHUNK_DURATION_MS);
  };

  const startRecording = async () => {
    try {
      setError('');
      chunksRef.current = [];
      durationRef.current = 0;
      setUploadProgress(0);
      setRecordingBlob(null);
      setRecordingUrl(null);

      await startMediaStream();

      durationIntervalRef.current = setInterval(() => {
        durationRef.current += 1;
      }, 1000);

      setIsRecording(true);
      recordChunk();
    } catch (err) {
      setError('Microphone permission denied or unsupported.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const uploadRecording = async () => {
    if (!chunksRef.current.length) return;
    try {
      setIsUploading(true);
      setError('');
      setUploadProgress(0);
      setTotalChunks(chunksRef.current.length);

      const ext = chunksRef.current[0].type.includes('ogg')
        ? 'ogg'
        : chunksRef.current[0].type.includes('mp4') || chunksRef.current[0].type.includes('m4a')
        ? 'm4a'
        : chunksRef.current[0].type.includes('wav')
        ? 'wav'
        : 'webm';

      for (let i = 0; i < chunksRef.current.length; i++) {
        const chunk = chunksRef.current[i];
        const filename = `recording_part_${i + 1}_of_${chunksRef.current.length}.${ext}`;
        const form = new FormData();

        form.append('file', new File([chunk], filename, { type: chunk.type }));
        form.append('title', `${title.trim() || 'New recording'} (Part ${i + 1}/${chunksRef.current.length})`);
        form.append('status', status);
        form.append('duration', durationRef.current.toString());

        const res = await fetch('/api/audio/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload failed for part ${i + 1}`);

        setUploadProgress(((i + 1) / chunksRef.current.length) * 100);
      }

      if (onUploaded) onUploaded();

      chunksRef.current = [];
      setRecordingBlob(null);
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      setTitle('New recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Record Audio</h3>
      {error && <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded mb-3">{error}</div>}
      <div className="flex items-center gap-3 mb-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isUploading}
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
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
          className="border rounded px-2 py-1 text-sm flex-1"
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

      {recordingUrl && (
        <div className="space-y-2 mb-3">
          <audio controls src={recordingUrl} className="w-full" />
          <div className="text-xs text-gray-500">
            Type: {recordingBlob?.type || 'unknown'} | Size:{' '}
            {recordingBlob ? formatFileSize(recordingBlob.size) : 'unknown'} | Duration:{' '}
            {formatDuration(durationRef.current)}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">
            Uploading {uploadProgress.toFixed(0)}% ({Math.ceil((totalChunks * uploadProgress) / 100)} of {totalChunks}{' '}
            parts)
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        disabled={!chunksRef.current.length || isUploading}
        onClick={uploadRecording}
        className={`px-3 py-2 rounded ${
          !chunksRef.current.length || isUploading
            ? 'bg-gray-300 text-gray-600'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Recording'}
      </button>
    </div>
  );
}