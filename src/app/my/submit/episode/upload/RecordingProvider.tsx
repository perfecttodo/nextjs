'use client';

import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

interface RecordProvider {
  onSuccess: (blob: Blob) => void;
  onStart?: () => void;
}

// Utility function to convert AudioBuffer to WAV Blob
function bufferToWave(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sample: number;
  let offset = 0;

  // Write WAV header
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + abuffer.length * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, abuffer.sampleRate, true);
  view.setUint32(28, abuffer.sampleRate * numOfChan * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, abuffer.length * numOfChan * 2, true);

  // Write PCM data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  offset = 44;
  for (let i = 0; i < abuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      sample = Math.max(-1, Math.min(1, channels[channel][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function AudioRecord({ onSuccess, onStart }: RecordProvider) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioSize, setAudioSize] = useState<string>('0 KB');
  const [audioFormat, setAudioFormat] = useState<string>('webm');
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<any>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4F46E5',
      progressColor: '#3730A3',
      cursorColor: '#3730A3',
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 100,
      normalize: true,
      plugins: [RegionsPlugin.create()],
    });

    regionsRef.current = wavesurferRef.current.registerPlugin(RegionsPlugin.create());

    wavesurferRef.current.on('ready', () => {
      setDuration(wavesurferRef.current?.getDuration() || 0);
    });

    wavesurferRef.current.on('audioprocess', () => {
      setCurrentTime(wavesurferRef.current?.getCurrentTime() || 0);
    });

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  // Load audio when URL changes
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

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
          channelCount: 1,
        },
      });

      streamRef.current = stream;

      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

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
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          onSuccess(blob);
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      onStart?.();

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
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

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const playPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && wavesurferRef.current) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFormat(file.type.split('/')[1] || 'audio');
      setAudioSize(`${(file.size / 1024).toFixed(2)} KB`);
    }
  };

  const addRegion = () => {
    if (!wavesurferRef.current || !regionsRef.current) return;

    const duration = wavesurferRef.current.getDuration();
    const start = Math.max(0, (wavesurferRef.current.getCurrentTime() || 0) - 5);
    const end = Math.min(duration, (wavesurferRef.current.getCurrentTime() || 0) + 5);

    regionsRef.current.addRegion({
      start,
      end,
      color: 'rgba(79, 70, 229, 0.3)',
      drag: true,
      resize: true,
    });

    console.log(regionsRef.current.getRegions());
  };

  const trimAudio = async () => {
    if (!wavesurferRef.current || !regionsRef.current) return;

    const regions = regionsRef.current.getRegions();
    if (regions.length === 0) {
      setError('No region selected for trimming.');
      return;
    }

    const region = regions[0];
    const start = region.start;
    const end = region.end;

    // Get the decoded audio data
    const audioBuffer = wavesurferRef.current.getDecodedData();
    if (!audioBuffer) {
      setError('No audio data available for trimming.');
      return;
    }

    // Create an offline audio context for trimming
    const sampleRate = audioBuffer.sampleRate;
    const newLength = Math.floor((end - start) * sampleRate);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      sampleRate
    );

    // Create a new buffer source
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Connect and trim
    source.connect(offlineCtx.destination);
    source.start(0, start, end - start);

    // Render the trimmed audio
    try {
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert to WAV blob
      const wavBlob = bufferToWave(renderedBuffer);

      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      setAudioSize(`${(wavBlob.size / 1024).toFixed(2)} KB`);
      setAudioFormat('wav');
      onSuccess(wavBlob);

      // Reload the trimmed audio into WaveSurfer
      wavesurferRef.current.loadBlob(wavBlob);
    } catch (err) {
      setError('Failed to trim audio. Please try again.');
      console.error('Trimming error:', err);
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

        <div ref={waveformRef} className="w-full h-24 border rounded-md"></div>

        {audioUrl && (
          <div className="flex items-center space-x-4">
            <button
              onClick={playPause}
              className="p-2 bg-blue-600 text-white rounded-full"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className="text-sm text-gray-600">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </span>
          </div>
        )}

        {isRecording && (
          <div className="w-full grid grid-cols-3 gap-2 text-sm text-gray-600">
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
          </div>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`py-3 px-6 rounded-lg text-white font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={!!error}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or insert existing audio
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {audioUrl && (
          <div className="flex space-x-2">
            <button
              onClick={addRegion}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm"
            >
              Mark Region
            </button>
            <button
              onClick={trimAudio}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
            >
              Trim Audio
            </button>
          </div>
        )}

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