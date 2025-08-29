'use client';

import { useState, useRef, useEffect } from 'react';

interface RecordProvider {
  onSuccess: (blob: Blob) => void;
  onStart?: () => void;
}
export default function AudioRecord({ onSuccess,onStart }: RecordProvider) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioSize, setAudioSize] = useState<string>('0 KB');
  const [audioFormat, setAudioFormat] = useState<string>('webm');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      chunksRef.current = [];
      setRecordingDuration(0);
      setAudioSize('0 KB');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      streamRef.current = stream;

      // Determine supported MIME type with preference for webm with opus
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      // Set format based on actual MIME type
      const mimeType = mediaRecorderRef.current.mimeType;
      setAudioFormat(mimeType.split(';')[0].split('/')[1] || 'webm');

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const sizeInKB = (blob.size / 1024).toFixed(2);
          setAudioSize(`${sizeInKB} KB`);
          onSuccess(blob);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second for better progress
      setIsRecording(true);
      onStart?.();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Unable to access microphone. Please check your permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clean up timer and stream
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">

      <div className="flex flex-col items-center space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <div className="text-gray-400 text-4xl">🎤</div>

        {/* Recording Info */}
        {isRecording && (<div className="w-full grid grid-cols-3 gap-2 text-sm text-gray-600">
          <div className="text-center">
            <div className="font-semibold">Duration</div>
            <div className="text-lg font-mono">{formatDuration(recordingDuration)}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Size</div>
            <div className="text-lg">{audioSize}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Format</div>
            <div className="text-lg uppercase">{audioFormat}</div>
          </div>
        </div>)}


        {/* Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`py-3 px-6 rounded-lg text-white font-medium transition-colors ${isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
          disabled={!!error}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording...</span>
          </div>
        )}
      </div>
    </div>
  );
}