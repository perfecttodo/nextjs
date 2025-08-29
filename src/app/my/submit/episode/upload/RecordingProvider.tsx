'use client';

import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js'

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
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;

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

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4F46E5',
      progressColor: '#3730A3',
      cursorColor: '#3730A3',
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 100,
      normalize: true,
    });
    wavesurferRef.current = ws;

    // Initialize regions plugin once
    regionsRef.current = ws.registerPlugin(RegionsPlugin.create());
    ws.registerPlugin(Minimap.create({
      height: 20,
      waveColor: '#ddd',
      progressColor: '#999',
      // the Minimap takes all the same options as the WaveSurfer itself
    }));
    
    ws.on('ready', () => {
      setDuration(ws.getDuration() || 0);
      setCurrentTime(0);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime() || 0);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => {
      ws.destroy();
    };
  }, []);

  // Load audio when URL changes, and wait for ready
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (audioUrl && ws) {
      // Clear existing regions before loading new audio
      if (regionsRef.current) {
        regionsRef.current.clearRegions();
      }

      ws.load(audioUrl);

      const onReady = () => {
        setDuration(ws.getDuration() || 0);
        setCurrentTime(0);
      };
      ws.once('ready', onReady);
    }
  }, [audioUrl]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    // Prevent starting a new recording if already recording
    if (isRecording) {
      setError('Recording already in progress.');
      return;
    }
  
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
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
  
      const mimeType = recorder.mimeType;
      setAudioFormat(mimeType.split(';')[0].split('/')[1] || 'webm');
  
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
  
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const sizeInKB = (blob.size / 1024).toFixed(2);
          setAudioSize(`${sizeInKB} KB`);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          onSuccess(blob);
        }
        // Reset state after stopping
        setIsRecording(false);
        setRecordingDuration(0);
        setAudioSize('0 KB');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        mediaRecorderRef.current = null;
      };
  
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stopRecording(); // Ensure cleanup on error
      };
  
      recorder.start(1000);
      setIsRecording(true);
      onStart?.();
  
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Unable to access microphone. Please check your permissions.');
      console.error('Recording error:', err);
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
        setError('Failed to stop recording. Please try again.');
      }
    } else {
      // Ensure cleanup even if MediaRecorder is not active
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
      setRecordingDuration(0);
      setAudioSize('0 KB');
    }
  };

  const playPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFormat(file.type.split('/')[1] || 'audio');
      setAudioSize(`${(file.size / 1024).toFixed(2)} KB`);
    }
  };

  const addRegion = () => {
    const ws = wavesurferRef.current;
    const rp = regionsRef.current;
    if (!ws || !rp) return;

    const dur = ws.getDuration();
    const center = ws.getCurrentTime() || 0;
    const half = 2.5; // default ~5 seconds window
    const start = Math.max(0, Math.min(dur, center - half));
    let end = Math.max(0, Math.min(dur, center + half));
    const minLen = 0.05; // 50ms minimum
    if (end - start < minLen) {
      end = Math.min(dur, start + minLen);
    }

    rp.clearRegions();

    rp.addRegion({
      start,
      end,
      color: 'rgba(79, 70, 229, 0.3)',
      drag: true,
      resize: true,
    });
  };

  const trimAudio = async () => {
    const ws = wavesurferRef.current;
    const regionsPlugin = regionsRef.current;
    if (!ws || !regionsPlugin) return;
  
    // Stop playback to avoid race conditions during trimming
    if (ws.isPlaying()) ws.pause();
  
    const regions = regionsPlugin.getRegions();
    if (!regions.length) {
      setError('No region selected to remove.');
      return;
    }
  
    // Use the first region
    const region = regions[0];
    const dur = ws.getDuration();
  
    // Clamp to duration and ensure valid range
    const startSec = Math.max(0, Math.min(region.start, dur));
    const endSec = Math.max(0, Math.min(region.end, dur));
  
    if (endSec <= startSec) {
      setError('Region length is zero. Adjust the handles and try again.');
      return;
    }
  
    const audioBuffer = ws.getDecodedData();
    if (!audioBuffer) {
      setError('No audio data available for trimming.');
      return;
    }
  
    try {
      const sr = audioBuffer.sampleRate;
      const totalSamples = audioBuffer.length;
  
      // Convert seconds to sample indices with consistent rounding
      const startSample = Math.max(0, Math.min(totalSamples, Math.round(startSec * sr)));
      const endSample = Math.max(0, Math.min(totalSamples, Math.round(endSec * sr)));
  
      if (endSample <= startSample) {
        setError('Selected region too small to remove.');
        return;
      }
  
      const leftLen = startSample;                 // samples before region
      const rightLen = totalSamples - endSample;   // samples after region
      const newLen = leftLen + rightLen;
  
      // If removing the whole audio, create a tiny silent buffer to avoid errors
      const finalLen = Math.max(newLen, 1);
  
      const channels = audioBuffer.numberOfChannels;
      const out = new AudioBuffer({
        length: finalLen,
        numberOfChannels: channels,
        sampleRate: sr,
      });
  
      // Copy left segment [0, startSample)
      // Copy right segment [endSample, totalSamples) to position leftLen
      for (let ch = 0; ch < channels; ch++) {
        if (leftLen > 0) {
          const left = new Float32Array(leftLen);
          audioBuffer.copyFromChannel(left, ch, 0);
          out.copyToChannel(left, ch, 0);
        }
  
        if (rightLen > 0) {
          const right = new Float32Array(rightLen);
          audioBuffer.copyFromChannel(right, ch, endSample);
          out.copyToChannel(right, ch, leftLen);
        }
  
        // If newLen === 0, out stays as 1-sample silent buffer.
      }
  
      const wavBlob = bufferToWave(out);
      const url = URL.createObjectURL(wavBlob);
  
      // Clear regions before loading the trimmed audio
      regionsPlugin.clearRegions();
  
      // Update UI and WaveSurfer by replacing the audio
      setAudioUrl(url);
      setAudioSize(`${(wavBlob.size / 1024).toFixed(2)} KB`);
      setAudioFormat('wav');
  
      // Notify parent
      onSuccess(wavBlob);
    } catch (err) {
      console.error('Trim-remove error:', err);
      setError('Failed to remove region from audio. Please try again.');
    }
  };

  const insertAudioAtRegion = async () => {
    const ws = wavesurferRef.current;
    const regionsPlugin = regionsRef.current;
    if (!ws || !regionsPlugin) {
      setError('WaveSurfer or regions plugin not initialized.');
      return;
    }
  
    const regions = regionsPlugin.getRegions();
    if (!regions.length) {
      setError('Please mark a region to insert audio.');
      return;
    }
  
    const region = regions[0];
    const insertPosition = region.start; // Insertion point in seconds
    const originalAudioBuffer = ws.getDecodedData();
  
    if (!originalAudioBuffer) {
      setError('No audio loaded to insert into.');
      return;
    }
  
    let audioContext: AudioContext | null = null;
  
    try {
      // Start recording new audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: originalAudioBuffer.sampleRate,
          channelCount: originalAudioBuffer.numberOfChannels,
        },
      });
  
      streamRef.current = stream;
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
  
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
  
      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          setError('No audio recorded.');
          return;
        }
  
        const newAudioBlob = new Blob(chunksRef.current, { type: options.mimeType });
        const arrayBuffer = await newAudioBlob.arrayBuffer();
        audioContext = new AudioContext();
        let newAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
        // Resample if sample rates don't match
        if (newAudioBuffer.sampleRate !== originalAudioBuffer.sampleRate) {
          const offlineContext = new OfflineAudioContext(
            newAudioBuffer.numberOfChannels,
            Math.round(
              (newAudioBuffer.length * originalAudioBuffer.sampleRate) / newAudioBuffer.sampleRate
            ),
            originalAudioBuffer.sampleRate
          );
  
          const source = offlineContext.createBufferSource();
          source.buffer = newAudioBuffer;
          source.connect(offlineContext.destination);
          source.start();
  
          newAudioBuffer = await offlineContext.startRendering();
          // Do not close audioContext here; close it later
        }
  
        // Merge audio buffers
        const newLength = originalAudioBuffer.length + newAudioBuffer.length;
        const mergedBuffer = new AudioBuffer({
          length: newLength,
          numberOfChannels: originalAudioBuffer.numberOfChannels,
          sampleRate: originalAudioBuffer.sampleRate,
        });
  
        const insertSample = Math.round(insertPosition * originalAudioBuffer.sampleRate);
  
        for (let ch = 0; ch < originalAudioBuffer.numberOfChannels; ch++) {
          const originalData = originalAudioBuffer.getChannelData(ch);
          const newData = newAudioBuffer.getChannelData(ch);
          const mergedData = mergedBuffer.getChannelData(ch);
  
          for (let i = 0; i < insertSample; i++) {
            mergedData[i] = originalData[i] || 0;
          }
  
          for (let i = 0; i < newAudioBuffer.length; i++) {
            mergedData[insertSample + i] = newData[i] || 0;
          }
  
          for (let i = insertSample; i < originalAudioBuffer.length; i++) {
            mergedData[i + newAudioBuffer.length] = originalData[i] || 0;
          }
        }
  
        // Convert merged buffer to WAV
        const wavBlob = bufferToWave(mergedBuffer);
        const url = URL.createObjectURL(wavBlob);
  
        // Update UI and WaveSurfer
        setAudioUrl(url);
        setAudioSize(`${(wavBlob.size / 1024).toFixed(2)} KB`);
        setAudioFormat('wav');
        regionsPlugin.clearRegions();
        onSuccess(wavBlob);
  
        // Cleanup
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (audioContext) {
          await audioContext.close();
          audioContext = null;
        }
  
        setIsRecording(false);
        setRecordingDuration(0);
        setAudioSize('0 KB');
      };
  
      // Start recording
      setIsRecording(true);
      recorder.start(1000);
  
      // Update duration during recording
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to start recording or insert audio.');
      console.error('Insert audio error:', err);
      if (audioContext) {
        await audioContext.close();
        audioContext = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
            <button
              onClick={insertAudioAtRegion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              disabled={isRecording}
            >
              Record & Insert
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