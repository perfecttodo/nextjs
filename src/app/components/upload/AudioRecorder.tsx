'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioStatus, Label } from '@/types/audio';
import AudioFormFields from './AudioFormFields';

interface AudioRecorderProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedGroupId: string;
  selectedAlbumId: string;
  selectedLabels: Label[]; // Added
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onGroupChange: (groupId: string) => void;
  onAlbumChange: (albumId: string) => void;
  onLabelsChange: (labels: Label[]) => void; // Added
  onUploaded?: () => void;
  ownerId:string;

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

export function playBreakSound() {
  try {
    // Check if Web Audio API is supported
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.log('Web Audio API not supported');
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play a more pleasant sound for breaks
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  } catch (error) {
    console.log('Break sound failed:', error);
  }
}

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export default function AudioRecorder({
  title,
  status,
  language,
  description,
  originalWebsite,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedGroupId,
  selectedAlbumId,
  selectedLabels, // Added
  onTitleChange,
  onStatusChange,
  onLanguageChange,
  onDescriptionChange,
  onOriginalWebsiteChange,
  onCategoryChange,
  onSubcategoryChange,
  onGroupChange,
  onAlbumChange,
  onLabelsChange, // Added
  onUploaded,
  ownerId
}: AudioRecorderProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const startRecording = async (isLimited:boolean) => {
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
          
          if (isLimited&&curSizeRef.current >= MAX_SIZE_BYTES) {
            // Request the final chunk and stop
            recorder.requestData();
            recorder.stop(); // Stop recording here to ensure it captures the final data
            setTimeout(()=>playBreakSound,10);
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
      setUploadProgress(0);
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
      if (language) form.append('language', language);
      if (description) form.append('description', description);
      if (originalWebsite) form.append('originalWebsite', originalWebsite);
      form.append('duration', duration.toString());
      if (selectedCategoryId) {
        form.append('categoryId', selectedCategoryId);
      }
      if (selectedSubcategoryId) {
        form.append('subcategoryId', selectedSubcategoryId);
      }
      // Add label IDs
      selectedLabels.forEach(label => {
        form.append('labelIds', label.id);
      });

      const res: Response = await new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/episode/upload');
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onload = () => {
            const status = xhr.status;
            const statusText = xhr.statusText;
            const headers = new Headers();
            const response = new Response(xhr.response, { status, statusText, headers });
            resolve(response);
          };
          xhr.send(form);
        } catch (err) {
          reject(err);
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (onUploaded) onUploaded();
      
      // Reset
      setRecordingBlob(null);
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      onTitleChange('New recording');
      onLanguageChange('');
      onDescriptionChange('');
      onOriginalWebsiteChange('');
      onCategoryChange('');
      onSubcategoryChange('');
      onLabelsChange([]); // Added - reset labels
      curSizeRef.current = 0;
      setCurrentSize(0);
      setDuration(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
      )}
      
      <div className="flex flex-col gap-3">
        {!isRecording ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => startRecording(false)} className="w-full px-4 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white">
              Start Unlimited Recording
            </button>
            <button onClick={() => startRecording(true)} className="w-full px-4 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white">
              Start 4M Recording
            </button>
          </div>
        ) : (
          <button onClick={stopRecording} className="w-full px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white">
            Stop Recording
          </button>
        )}
      </div>

      {/* Show current size and duration during recording */}
      {isRecording && (
        <div className="text-sm text-gray-600">
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
        <div className="space-y-2">
          <audio controls src={recordingUrl} className="w-full" loop />
          <div className="text-xs text-gray-500">
            Type: {recordingBlob?.type || 'unknown'} | 
            Size: {recordingBlob ? formatFileSize(recordingBlob.size) : 'unknown'} |
            Duration: {formatDuration(duration)}
          </div>
        </div>
      )}

      {/* Common Form Fields - only show when there's a recording */}
        <div>
          <AudioFormFields
            title={title}
            status={status}
            language={language}
            description={description}
            originalWebsite={originalWebsite}
            selectedAlbumId={selectedAlbumId}
            onTitleChange={onTitleChange}
            onStatusChange={onStatusChange}
            onLanguageChange={onLanguageChange}
            onDescriptionChange={onDescriptionChange}
            onOriginalWebsiteChange={onOriginalWebsiteChange}
            onAlbumChange={onAlbumChange}
            showStatusHelp={true}
            ownerId={ownerId}
          />
        </div>

      {recordingBlob && (
        <button
          disabled={isUploading}
          onClick={uploadRecording}
          className={`w-full px-4 py-3 rounded ${
            !recordingBlob || isUploading 
              ? 'bg-gray-300 text-gray-600' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Recording'}
        </button>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">Uploading {uploadProgress}%</div>
        </div>
      )}
    </div>
  );
}