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
const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB
const CLUSTER_DURATION_MS = 1000; // WebM clusters are typically 1 second

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentSize, setCurrentSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [sampleChunkUrl, setSampleChunkUrl] = useState<string | null>(null);
  const [chunkVerificationStatus, setChunkVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      if (sampleChunkUrl) URL.revokeObjectURL(sampleChunkUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [recordingUrl, sampleChunkUrl]);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus', // Best for chunking
      'audio/webm',             // Fallback
      'audio/ogg;codecs=opus',  // Alternative
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
  };

  const startRecording = async () => {
    try {
      setError('');
      setCurrentSize(0);
      setDuration(0);
      setUploadProgress(0);
      setSampleChunkUrl(null);
      setChunkVerificationStatus('idle');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          const newSize = currentSize + e.data.size;
          setCurrentSize(newSize);
          
          if (newSize >= MAX_SIZE_BYTES) {
            stopRecording();
          }
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setIsRecording(false);
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      recorder.start(1000);
      setIsRecording(true);
    } catch (e) {
      setError('Microphone permission denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
    }
  };

  const calculateClusterBoundaries = (blob: Blob, durationMs: number): number[] => {
    const boundaries = [];
    const clusterCount = Math.ceil(durationMs / CLUSTER_DURATION_MS);
    const clusterSize = blob.size / clusterCount;
    
    for (let i = 0; i < clusterCount; i++) {
      boundaries.push(Math.floor(i * clusterSize));
    }
    boundaries.push(blob.size);
    
    return boundaries;
  };

  const createPlayableChunks = (originalBlob: Blob): Blob[] => {
    if (!originalBlob.type.includes('webm') && !originalBlob.type.includes('ogg')) {
      // For non-streamable formats, we can't properly split them
      return [originalBlob];
    }

    const durationMs = duration * 1000;
    const clusterBoundaries = calculateClusterBoundaries(originalBlob, durationMs);
    const chunks: Blob[] = [];
    let chunkStart = 0;
    let currentChunkSize = 0;

    for (let i = 1; i < clusterBoundaries.length; i++) {
      const clusterEnd = clusterBoundaries[i];
      const clusterSize = clusterEnd - chunkStart;
      
      if (currentChunkSize + clusterSize > MAX_CHUNK_SIZE && chunks.length > 0) {
        // Finish current chunk
        chunks.push(originalBlob.slice(chunkStart, clusterBoundaries[i - 1], originalBlob.type));
        chunkStart = clusterBoundaries[i - 1];
        currentChunkSize = 0;
      }
      
      currentChunkSize += clusterSize;
      
      if (i === clusterBoundaries.length - 1) {
        // Add remaining data
        chunks.push(originalBlob.slice(chunkStart, clusterEnd, originalBlob.type));
      }
    }

    return chunks;
  };

  const verifyChunkPlayability = async (chunk: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(chunk);
      const audio = new Audio();
      
      audio.src = url;
      audio.preload = 'metadata';
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      audio.oncanplay = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };
      
      audio.load();
    });
  };

  const uploadRecording = async () => {
    if (!recordingBlob) return;
    
    try {
      setIsUploading(true);
      setError('');
      setUploadProgress(0);
      setSampleChunkUrl(null);
      setChunkVerificationStatus('verifying');
      
      // Create properly segmented chunks
      const chunks = createPlayableChunks(recordingBlob);
      setTotalChunks(chunks.length);
      
      // Verify first chunk is playable
      if (chunks.length > 0) {
        const isPlayable = await verifyChunkPlayability(chunks[0]);
        setChunkVerificationStatus(isPlayable ? 'success' : 'failed');
        
        if (isPlayable) {
          const url = URL.createObjectURL(chunks[0]);
          setSampleChunkUrl(url);
        } else {
          setError('Failed to create playable chunks. The recording may be corrupted.');
          return;
        }
      }
      
      const ext = recordingBlob.type.includes('ogg')
        ? 'ogg'
        : recordingBlob.type.includes('mp4') || recordingBlob.type.includes('m4a')
        ? 'm4a'
        : recordingBlob.type.includes('wav')
        ? 'wav'
        : 'webm';
      
      for (let i = 0; i < chunks.length; i++) {
        const form = new FormData();
        const chunk = chunks[i];
        const filename = `recording_part_${i + 1}_of_${chunks.length}.${ext}`;
        
        form.append('file', new File([chunk], filename, { type: recordingBlob.type }));
        form.append('title', `${title.trim() || 'New recording'} (Part ${i + 1}/${chunks.length})`);
        form.append('status', status);
        form.append('duration', duration.toString());
        
        const res = await fetch('/api/audio/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload failed for part ${i + 1}`);
        
        setUploadProgress(((i + 1) / chunks.length) * 100);
      }
      
      if (onUploaded) onUploaded();
      
      // Reset
      setRecordingBlob(null);
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      setTitle('New recording');
      setCurrentSize(0);
      setDuration(0);
      setUploadProgress(0);
      setChunkVerificationStatus('idle');
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

      {isUploading && (
        <div className="space-y-3 mb-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Uploading {uploadProgress.toFixed(0)}% ({Math.ceil((totalChunks * uploadProgress) / 100)} of {totalChunks} parts)
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>

          {chunkVerificationStatus === 'verifying' && (
            <div className="text-sm text-blue-600">
              Verifying chunk playability...
            </div>
          )}
          {chunkVerificationStatus === 'failed' && (
            <div className="text-sm text-red-600">
              Chunk verification failed - audio may be corrupted
            </div>
          )}
        </div>
      )}

      {sampleChunkUrl && (
        <div className="space-y-2 mb-3">
          <h4 className="text-sm font-medium">First Chunk Preview:</h4>
          <audio controls src={sampleChunkUrl} className="w-full" />
          <div className="text-xs text-gray-500">
            This is a preview of the first chunk to verify playability
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