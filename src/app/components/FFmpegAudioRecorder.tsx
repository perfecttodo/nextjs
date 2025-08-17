'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioStatus, Label } from '@/types/audio';
import AudioFormFields from './AudioFormFields';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface FFmpegAudioRecorderProps {
  title: string;
  status: AudioStatus;
  language?: string;
  description?: string;
  originalWebsite?: string;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedLabels: Label[];
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  onUploaded?: () => void;
}

export default function FFmpegAudioRecorder(props: FFmpegAudioRecorderProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ffmpegRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSize, setCurrentSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'m3u8' | 'mp3' | 'm4a'>('m3u8');

  const curSizeRef = useRef(0);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    try {
      setFfmpegLoading(true);
      
      // Import FFmpeg dynamically to avoid SSR issues
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setError('Failed to load FFmpeg. Please refresh the page and try again.');
    } finally {
      setFfmpegLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      curSizeRef.current = 0;
      setCurrentSize(0);
      setDuration(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          curSizeRef.current += event.data.size;
          setCurrentSize(curSizeRef.current);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        setRecordingUrl(URL.createObjectURL(blob));
        
        // Process with FFmpeg if loaded
        if (ffmpegRef.current) {
          await processAudioWithFFmpeg(blob);
        }
      };

      recorder.start(100);
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const processAudioWithFFmpeg = async (inputBlob: Blob) => {
    if (!ffmpegRef.current) {
      setError('FFmpeg not loaded');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      const ffmpeg = ffmpegRef.current;
      
      // Write input file
      const inputData = await inputBlob.arrayBuffer();
      await ffmpeg.writeFile('input.webm', new Uint8Array(inputData));

      // Process based on output format
      let outputFileName: string;
      let ffmpegArgs: string[];

      switch (outputFormat) {
        case 'm3u8':
          outputFileName = 'output.m3u8';
          ffmpegArgs = [
            '-i', 'input.webm',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-hls_time', '2',
            '-hls_list_size', '0',
            '-hls_segment_filename', 'segment_%03d.ts',
            outputFileName
          ];
          break;
        case 'mp3':
          outputFileName = 'output.mp3';
          ffmpegArgs = [
            '-i', 'input.webm',
            '-c:a', 'mp3',
            '-b:a', '128k',
            outputFileName
          ];
          break;
        case 'm4a':
          outputFileName = 'output.m4a';
          ffmpegArgs = [
            '-i', 'input.webm',
            '-c:a', 'aac',
            '-b:a', '128k',
            outputFileName
          ];
          break;
        default:
          throw new Error('Unsupported output format');
      }

      // Run FFmpeg command
      await ffmpeg.exec(ffmpegArgs);

      // Read output file
      const outputData = await ffmpeg.readFile(outputFileName);
      
      // Create new blob with processed audio
      const processedBlob = new Blob([outputData], { 
        type: outputFormat === 'm3u8' ? 'application/x-mpegURL' : 'audio/mpeg' 
      });
      
      setRecordingBlob(processedBlob);
      
      // Update URL
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      setRecordingUrl(URL.createObjectURL(processedBlob));

      // Clean up FFmpeg files
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile(outputFileName);
      if (outputFormat === 'm3u8') {
        // Clean up HLS segments
        const files = await ffmpeg.listDir('.');
        for (const file of files) {
          if (file.isFile && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
            await ffmpeg.deleteFile(file.name);
          }
        }
      }

    } catch (error) {
      console.error('FFmpeg processing error:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadRecording = async () => {
    if (!recordingBlob || !props.selectedCategoryId) {
      setError('Please record audio and select a category before uploading.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const form = new FormData();
      const ext = outputFormat === 'm3u8' ? 'm3u8' : outputFormat;
      const mimeType = outputFormat === 'm3u8' ? 'application/x-mpegURL' : 
                      outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      
      const file = new File([recordingBlob], `recording.${ext}`, { type: mimeType });
      form.append('file', file);
      form.append('title', props.title.trim() || 'New recording');
      form.append('status', props.status);
      form.append('duration', duration.toString());
      form.append('language', props.language || '');
      form.append('description', props.description || '');
      form.append('originalWebsite', props.originalWebsite || '');
      form.append('categoryId', props.selectedCategoryId);
      if (props.selectedSubcategoryId) {
        form.append('subcategoryId', props.selectedSubcategoryId);
      }
      props.selectedLabels.forEach(label => {
        form.append('labelIds', label.id);
      });

      const res = await fetch('/api/audio/upload', { method: 'POST', body: form });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      if (props.onUploaded) props.onUploaded();
      
      // Reset
      setRecordingBlob(null);
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      props.onTitleChange('New recording');
      props.onLanguageChange('');
      props.onDescriptionChange('');
      props.onOriginalWebsiteChange('');
      props.onCategoryChange('');
      props.onSubcategoryChange('');
      props.onLabelsChange([]);
      curSizeRef.current = 0;
      setCurrentSize(0);
      setDuration(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [recordingUrl]);

  if (ffmpegLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FFmpeg...</p>
        </div>
      </div>
    );
  }

  if (!ffmpegLoaded) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">FFmpeg Failed to Load</h3>
          <p className="text-gray-500 mb-4">Unable to load audio processing capabilities.</p>
          <button
            onClick={loadFFmpeg}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry Loading FFmpeg
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="text-blue-500 text-4xl mb-4">🎙️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">FFmpeg Audio Recorder</h3>
        <p className="text-gray-500">Advanced audio recording with M3U8 HLS support</p>
      </div>
      
      {error && (
        <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
      )}
      
      {/* Output Format Selection */}
      <div>
        <label htmlFor="outputFormat" className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <select
          id="outputFormat"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as 'm3u8' | 'mp3' | 'm4a')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="m3u8">M3U8 (HLS Streaming)</option>
          <option value="mp3">MP3</option>
          <option value="m4a">M4A (AAC)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {outputFormat === 'm3u8' && 'HLS format for streaming, creates multiple segments'}
          {outputFormat === 'mp3' && 'MP3 format for compatibility'}
          {outputFormat === 'm4a' && 'M4A format with AAC codec for quality'}
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        {!isRecording ? (
          <button 
            onClick={startRecording} 
            className="w-full px-4 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording} 
            className="w-full px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Stop Recording
          </button>
        )}
      </div>

      {/* Show current size and duration during recording */}
      {isRecording && (
        <div className="text-sm text-gray-600">
          <div>Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</div>
          <div>Recording: {formatFileSize(currentSize)}</div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Processing audio with FFmpeg...</p>
        </div>
      )}

      {recordingUrl && (
        <div className="space-y-2">
          <audio controls src={recordingUrl} className="w-full" loop />
          <div className="text-xs text-gray-500">
            Type: {recordingBlob?.type || 'unknown'} | 
            Size: {recordingBlob ? formatFileSize(recordingBlob.size) : 'unknown'} |
            Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} |
            Format: {outputFormat.toUpperCase()}
          </div>
        </div>
      )}

      {/* Common Form Fields - only show when there's a recording */}
      {recordingBlob && (
        <div>
          <AudioFormFields
            title={props.title}
            status={props.status}
            language={props.language}
            description={props.description}
            originalWebsite={props.originalWebsite}
            selectedCategoryId={props.selectedCategoryId}
            selectedSubcategoryId={props.selectedSubcategoryId}
            selectedLabels={props.selectedLabels}
            onTitleChange={props.onTitleChange}
            onStatusChange={props.onStatusChange}
            onLanguageChange={props.onLanguageChange}
            onDescriptionChange={props.onDescriptionChange}
            onOriginalWebsiteChange={props.onOriginalWebsiteChange}
            onCategoryChange={props.onCategoryChange}
            onSubcategoryChange={props.onSubcategoryChange}
            onLabelsChange={props.onLabelsChange}
            categoryRequired={true}
            showStatusHelp={true}
          />
        </div>
      )}

      {recordingBlob && (
        <button
          disabled={isUploading || !props.selectedCategoryId}
          onClick={uploadRecording}
          className={`w-full px-4 py-3 rounded ${
            !recordingBlob || isUploading || !props.selectedCategoryId 
              ? 'bg-gray-300 text-gray-600' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : `Upload ${outputFormat.toUpperCase()} Recording`}
        </button>
      )}
    </div>
  );
}
