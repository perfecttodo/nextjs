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
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  selectedGroupId: string;
  selectedAlbumId: string;
  selectedLabels: Label[];
  onTitleChange: (title: string) => void;
  onStatusChange: (status: AudioStatus) => void;
  onLanguageChange: (language: string) => void;
  onDescriptionChange: (description: string) => void;
  onOriginalWebsiteChange: (originalWebsite: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onGroupChange: (groupId: string) => void;
  onAlbumChange: (albumId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  onUploaded?: () => void;
  ownerId:string;

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
  const [showM3U8Content, setShowM3U8Content] = useState(false);
  const [m3u8Content, setM3u8Content] = useState<string>('');
  const [m3u8ContentLoading, setM3u8ContentLoading] = useState(false);
  const [useFFmpeg, setUseFFmpeg] = useState(false); // New state for FFmpeg choice

  const curSizeRef = useRef(0);

  // Function to ensure M3U8 files end with #EXT-X-ENDLIST
  const ensureM3U8EndTag = (data: Uint8Array): Uint8Array => {
    const text = new TextDecoder().decode(data);
    
    // Check if #EXT-X-ENDLIST is already present
    if (text.includes('#EXT-X-ENDLIST')) {
      return data; // Already has the tag
    }
    
    // Add #EXT-X-ENDLIST if missing
    const updatedText = text.trim() + '\n#EXT-X-ENDLIST';
    return new TextEncoder().encode(updatedText);
  };

  // Function to get M3U8 content for display
  const getM3U8Content = async (): Promise<string> => {
    if (!ffmpegRef.current || outputFormat !== 'm3u8') return 'FFmpeg not available';
    
    try {
      const ffmpeg = ffmpegRef.current;
      const m3u8Data = await ffmpeg.readFile('output.m3u8');
      const text = new TextDecoder().decode(m3u8Data);
      
      // Check if #EXT-X-ENDLIST is present
      const hasEndTag = text.includes('#EXT-X-ENDLIST');
      const status = hasEndTag ? '✅ Valid HLS Playlist' : '⚠️ Missing #EXT-X-ENDLIST';
      
      return `${status}\n\n${text}`;
    } catch (error) {
      return `Error reading M3U8 content: ${error}`;
    }
  };

  useEffect(() => {
    
    if(useFFmpeg)
      loadFFmpeg();
  }, [useFFmpeg]);

  const loadFFmpeg = async () => {
    try {
      setFfmpegLoading(true);
      
      // Import FFmpeg dynamically to avoid SSR issues
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL,fetchFile } = await import('@ffmpeg/util');
      
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
      
      // Write input file with retry logic
      const inputData = await inputBlob.arrayBuffer();
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await ffmpeg.writeFile('input.webm', new Uint8Array(inputData));
          break; // Success, exit retry loop
        } catch (writeError) {
          retryCount++;
          console.warn(`FFmpeg write retry ${retryCount}/${maxRetries}:`, writeError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to write input file after ${maxRetries} attempts`);
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

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
            '-hls_playlist_type', 'vod',  // Video on Demand - ensures #EXT-X-ENDLIST
            '-hls_flags', 'independent_segments',  // Better compatibility
            '-hls_segment_type', 'mpegts',  // Explicit segment type
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

      // Run FFmpeg command with retry logic
      retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          await ffmpeg.exec(ffmpegArgs);
          break; // Success, exit retry loop
        } catch (execError) {
          retryCount++;
          console.warn(`FFmpeg exec retry ${retryCount}/${maxRetries}:`, execError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to process audio after ${maxRetries} attempts`);
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Read output file with retry logic
      retryCount = 0;
      let outputData: Uint8Array | undefined;
      
      while (retryCount < maxRetries) {
        try {
          outputData = await ffmpeg.readFile(outputFileName);
          break; // Success, exit retry loop
        } catch (readError) {
          retryCount++;
          console.warn(`FFmpeg read retry ${retryCount}/${maxRetries}:`, readError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to read output file after ${maxRetries} attempts`);
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (!outputData) {
        throw new Error('Failed to read output file data');
      }
      
      // For M3U8 files, ensure #EXT-X-ENDLIST tag is present
      let finalOutputData = outputData;
      if (outputFormat === 'm3u8') {
        finalOutputData = ensureM3U8EndTag(outputData);
      }
      
      // Create new blob with processed audio
      const processedBlob = new Blob([finalOutputData as any], { 
        type: outputFormat === 'm3u8' ? 'application/x-mpegURL' : 'audio/mpeg' 
      });
      
      setRecordingBlob(processedBlob);
      
      // Update URL
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      const newUrl = URL.createObjectURL(processedBlob);
      setRecordingUrl(newUrl);

      // Clean up FFmpeg files safely
     // await cleanupFFmpegFiles(ffmpeg);

    } catch (error) {
      console.error('FFmpeg processing error:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadRecording = async () => {
    if (!recordingBlob ) {
      setError('Please record audio before uploading.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // Handle HLS upload differently
      if (outputFormat === 'm3u8') {
        await uploadHLSRecording();
      } else {
        await uploadStandardRecording();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadStandardRecording = async () => {
    if (!recordingBlob) {
      throw new Error('No recording available for upload');
    }
    
    const form = new FormData();
    const ext = outputFormat;
    const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    
    const file = new File([recordingBlob], `recording.${ext}`, { type: mimeType });
    form.append('file', file);
    form.append('title', props.title.trim() || 'New recording');
    form.append('status', props.status);
    form.append('duration', duration.toString());
    form.append('language', props.language || '');
    form.append('description', props.description || '');
    form.append('originalWebsite', props.originalWebsite || '');



    const res = await fetch('/api/episode/upload', { method: 'POST', body: form });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    
    if (props.onUploaded) props.onUploaded();
    resetAfterUpload();
  };

  const uploadHLSRecording = async () => {
    // For HLS, we need to get the processed files from FFmpeg
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not available for HLS processing');
    }

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Check FFmpeg file system health first
      const fsHealthy = await checkFFmpegFS(ffmpeg);
      if (!fsHealthy) {
        throw new Error('FFmpeg file system is not healthy. Please try refreshing the page.');
      }
      
      // Store all file data before cleanup to avoid FS errors
      const filesToUpload: { name: string; data: Uint8Array; type: string }[] = [];
      
      try {
        // Get the M3U8 playlist content first
        const m3u8Data = await ffmpeg.readFile('output.m3u8');
        filesToUpload.push({
          name: 'playlist.m3u8',
          data: m3u8Data,
          type: 'application/x-mpegURL'
        });
        
        // Get all TS segment files
        const files = await ffmpeg.listDir('.');
        
        for (const file of files) {
          if (!file.isDir && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
            try {
              const tsData = await ffmpeg.readFile(file.name);
              filesToUpload.push({
                name: file.name,
                data: tsData,
                type: 'video/mp2t'
              });
            } catch (segmentError) {
              console.warn(`Failed to read segment ${file.name}:`, segmentError);
              // Continue with other segments
            }
          }
        }
        
        // Verify we have files to upload
        if (filesToUpload.length === 0) {
          throw new Error('No HLS files found for upload');
        }
        
        // Create form data for HLS upload
        const form = new FormData();
        
        // Add M3U8 file
        const m3u8File = filesToUpload.find(f => f.name === 'playlist.m3u8');
        if (m3u8File) {
          const m3u8Blob = new Blob([m3u8File.data as any], { type: m3u8File.type });
          form.append('m3u8File', m3u8Blob, 'playlist.m3u8');
        }
        
        // Add TS segment files
        const tsFiles = filesToUpload.filter(f => f.name !== 'playlist.m3u8');
        tsFiles.forEach((tsFile) => {
          const tsBlob = new Blob([tsFile.data as any], { type: tsFile.type });
          const tsFileObj = new File([tsBlob], tsFile.name, { type: tsFile.type });
          form.append('tsFiles', tsFileObj);
        });
        
        // Add metadata
        form.append('title', props.title.trim() || 'New recording');
        form.append('status', props.status);
        form.append('duration', duration.toString());
        form.append('language', props.language || '');
        form.append('description', props.description || '');
        form.append('originalWebsite', props.originalWebsite || '');

        // Upload files
        const res = await fetch('/api/episode/upload-hls', { method: 'POST', body: form });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'HLS upload failed');
        
        if (props.onUploaded) props.onUploaded();
        resetAfterUpload();
        
      } finally {
        // Clean up FFmpeg files after all data is extracted
        await cleanupFFmpegFiles(ffmpeg);
      }
      
    } catch (error) {
      console.error('HLS upload error:', error);
      throw new Error(`Failed to upload HLS files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check FFmpeg file system health
  const checkFFmpegFS = async (ffmpeg: any): Promise<boolean> => {
    try {
      // Try to list directory to check if FS is working
      await ffmpeg.listDir('.');
      return true;
    } catch (error) {
      console.warn('FFmpeg FS check failed:', error);
      return false;
    }
  };

  // Separate cleanup function to avoid FS errors
  const cleanupFFmpegFiles = async (ffmpeg: any) => {
    try {
      // Clean up input file
      try {
        await ffmpeg.deleteFile('input.webm');
      } catch (e) {
        console.warn('Could not delete input.webm:', e);
      }
      
      // Clean up output file
      try {
        await ffmpeg.deleteFile('output.m3u8');
      } catch (e) {
        console.warn('Could not delete output.m3u8:', e);
      }
      
      // Clean up HLS segments
      try {
        const files = await ffmpeg.listDir('.');
        for (const file of files) {
          if (file.isFile && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
            try {
              await ffmpeg.deleteFile(file.name);
            } catch (e) {
              console.warn(`Could not delete ${file.name}:`, e);
            }
          }
        }
      } catch (e) {
        console.warn('Could not list directory for cleanup:', e);
      }
    } catch (error) {
      console.warn('FFmpeg cleanup error:', error);
    }
  };

  const resetAfterUpload = () => {
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
      {/* Toggle for using FFmpeg or uploading original recording */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={useFFmpeg}
            onChange={(e) => setUseFFmpeg(e.target.checked)}
            className="mr-2"
          />
          <span>Use FFmpeg for conversion</span>
        </label>
      </div>
      {/* Output Format Selection */}
      {(useFFmpeg&&
      <div>
        {!ffmpegLoaded&&(
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
    )
  }
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
      </div>
  )}
      
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
          
          {/* M3U8 Content Display */}
          {outputFormat === 'm3u8' && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (!showM3U8Content) {
                    setM3u8ContentLoading(true);
                    const content = await getM3U8Content();
                    setM3u8Content(content);
                    setM3u8ContentLoading(false);
                  }
                  setShowM3U8Content(!showM3U8Content);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={m3u8ContentLoading}
              >
                {m3u8ContentLoading ? 'Loading...' : (showM3U8Content ? 'Hide' : 'Show')} M3U8 Content
              </button>
              
              {showM3U8Content && (
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                  <div className="text-gray-600 mb-2">M3U8 Playlist Content:</div>
                  <pre className="whitespace-pre-wrap break-words">
                    {m3u8Content}
                  </pre>
                </div>
              )}
            </div>
          )}
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
            selectedGroupId={props.selectedGroupId || ""}
            selectedAlbumId={props.selectedAlbumId}
            selectedLabels={props.selectedLabels}
            onTitleChange={props.onTitleChange}
            onStatusChange={props.onStatusChange}
            onLanguageChange={props.onLanguageChange}
            onDescriptionChange={props.onDescriptionChange}
            onOriginalWebsiteChange={props.onOriginalWebsiteChange}
            onCategoryChange={props.onCategoryChange}
            onSubcategoryChange={props.onSubcategoryChange}
            onGroupChange={props.onGroupChange || (() => {})}
            onAlbumChange={props.onAlbumChange}
            onLabelsChange={props.onLabelsChange}
            categoryRequired={false}
            showStatusHelp={true}
            ownerId={props.ownerId}
          />
        </div>
      )}

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
          {isUploading ? 'Uploading...' : `Upload ${outputFormat.toUpperCase()} Recording`}
        </button>
      )}
    </div>
  );
}
