'use client';

import { useState, useRef } from 'react';

interface RecordProvider {
  onSuccess: (blob: Blob) => void;
}

export default function AudioRecord({
  onSuccess,
}: RecordProvider) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [error, setError] = useState('');
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);



      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onSuccess(blob);
    }
  };



  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Audio Recording
      </label>

      <div className="flex flex-col items-center">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
        
        {(
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">🎤</div>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`py-2 px-4 rounded-lg text-white ${
                isRecording ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        )}
      </div>


    </div>
  );
}