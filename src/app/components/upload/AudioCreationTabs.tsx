'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioStatus, Label } from '@/types/audio';
import { useUser } from '../../hooks/useUser';
import { presignUploadSingle, presignUploadBatch } from '@/lib/presign';
import AudioFormFields from './AudioFormFields';
import UploadProvider from './UploadProvider';
import UrlProvider from './UrlProvider';
import RecordingProvider from './RecordingProvider';

interface AudioCreationTabsProps {
  onUploadSuccess: () => void;
}

type TabType = 'upload' | 'record' | 'url';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function AudioCreationTabs({ onUploadSuccess }: AudioCreationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading: userLoading } = useUser();

  const [sharedFormData, setSharedFormData] = useState({
    title: '',
    status: 'draft' as AudioStatus,
    language: '',
    description: '',
    originalWebsite: '',
    albumId: '',
  });

  // Recording state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'m3u8' | 'mp3' | 'm4a'>('m3u8');
  const [showM3U8Content, setShowM3U8Content] = useState(false);
  const [m3u8Content, setM3u8Content] = useState<string>('');
  const [m3u8ContentLoading, setM3u8ContentLoading] = useState(false);
  const [useFFmpeg, setUseFFmpeg] = useState(false);


  const ffmpegRef = useRef<any>(null);
  const curSizeRef = useRef(0);
  const oriBlob = useRef<Blob>(null);

  const tabs = [
    {
      id: 'upload' as TabType,
      label: 'Upload File',
      description: 'Upload audio files from your device',
      icon: '📁',
      shortLabel: 'Upload'
    },
    {
      id: 'record' as TabType,
      label: 'Record Audio',
      description: 'Record audio directly in your browser',
      icon: '🎙️',
      shortLabel: 'Record'
    },
    {
      id: 'url' as TabType,
      label: 'Audio URL',
      description: 'Submit audio from external URLs',
      icon: '🔗',
      shortLabel: 'URL'
    }
  ];

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



  async function processRecording(format: 'm3u8' | 'mp3' | 'm4a') {
    if (!oriBlob.current) return;
    const blob = oriBlob.current;
    setAudioBlob(oriBlob.current);
    setAudioUrl(URL.createObjectURL(blob));

    // Process with FFmpeg if loaded
    if (ffmpegRef.current) {
      await processAudioWithFFmpeg(blob, format);
    }
  }

  async function changeFormat(e: React.ChangeEvent<HTMLSelectElement>) {
    const newFormat = e.target.value as 'm3u8' | 'mp3' | 'm4a';
    setOutputFormat(newFormat);
    await new Promise(resolve => setTimeout(resolve, 100));
    await processRecording(newFormat);
  }


  const processAudioWithFFmpeg = async (inputBlob: Blob, format: 'm3u8' | 'mp3' | 'm4a') => {
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

      switch (format) {
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
      if (format === 'm3u8') {
        finalOutputData = ensureM3U8EndTag(outputData);
      }

      // Create new blob with processed audio
      const processedBlob = new Blob([finalOutputData as any], {
        type: format === 'm3u8' ? 'application/x-mpegURL' : 'audio/mpeg'
      });

      setAudioBlob(processedBlob);

      // Update URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newUrl = format === 'm3u8' ? oriBlob.current && URL.createObjectURL(oriBlob.current) : URL.createObjectURL(processedBlob);
      setAudioUrl(newUrl);

    } catch (error) {
      console.error('FFmpeg processing error:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      setError('Please record audio before uploading.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
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
      setUploadProgress(0);
    }
  };

  const uploadStandardRecording = async () => {
    if (!audioBlob) {
      throw new Error('No recording available for upload');
    }
    const ext = outputFormat;
    const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    const file = new File([audioBlob], `recording.${ext}`, { type: mimeType });

    // 1) Request presigned URL
    const presign = await presignUploadSingle(file.name, file.type);

    // 2) Upload file directly to R2 via PUT
    const putRes = await new Promise<Response>((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onload = () => {
          const status = xhr.status;
          const statusText = xhr.statusText;
          const headers = new Headers();
          const res = new Response(xhr.response, { status, statusText, headers });
          resolve(res);
        };
        xhr.send(file);
      } catch (err) {
        reject(err);
      }
    });
    if (!putRes.ok) throw new Error('Direct upload to storage failed');

    // 3) Finalize by creating episode using the public URL
    const finalizeRes = await fetch('/api/episode/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: presign.publicUrl,
        title: sharedFormData.title.trim() || 'New recording',
        status: sharedFormData.status,
        description: sharedFormData.description || '',
        originalWebsite: sharedFormData.originalWebsite || '',
        duration,
        albumId: sharedFormData.albumId || undefined,
      })
    });
    const finalizeData = await finalizeRes.json();
    if (!finalizeRes.ok) throw new Error(finalizeData.error || 'Failed to save episode');

    handleUploadSuccess();
    resetAfterUpload();
  };

  const uploadHLSRecording = async () => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not available for HLS processing');
    }

    try {
      const ffmpeg = ffmpegRef.current;

      const fsHealthy = await checkFFmpegFS(ffmpeg);
      if (!fsHealthy) {
        throw new Error('FFmpeg file system is not healthy. Please try refreshing the page.');
      }

      // Gather files from FFmpeg FS
      const filesToUpload: { name: string; data: Uint8Array; type: string }[] = [];

      const m3u8Data = await ffmpeg.readFile('output.m3u8');
      filesToUpload.push({ name: 'playlist.m3u8', data: m3u8Data, type: 'application/x-mpegURL' });

      const files = await ffmpeg.listDir('.');
      for (const file of files) {
        if (!file.isDir && file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
          try {
            const tsData = await ffmpeg.readFile(file.name);
            filesToUpload.push({ name: file.name, data: tsData, type: 'video/mp2t' });
          } catch (segmentError) {
            console.warn(`Failed to read segment ${file.name}:`, segmentError);
          }
        }
      }

      if (filesToUpload.length === 0) {
        throw new Error('No HLS files found for upload');
      }

      // 1) Ask server for presigned URLs for all files
      const presign = await presignUploadBatch(
        sharedFormData.title.trim() || 'New recording',
        filesToUpload.map(f => ({ name: f.name, contentType: f.type }))
      );

      // 2) Upload each file via PUT
      const nameToUploadUrl = new Map<string, string>(presign.files.map((f: any) => [f.name, f.uploadUrl]));
      // Upload with per-file progress and aggregate progress
      let uploadedBytes = 0;
      const totalBytes = filesToUpload.reduce((sum, file) => sum + file.data.byteLength, 0);
      for (const f of filesToUpload) {
        const uploadUrl = nameToUploadUrl.get(f.name);
        if (!uploadUrl) throw new Error(`Missing upload URL for ${f.name}`);

        await new Promise<void>((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', f.type);
            const blob = new Blob([f.data as any], { type: f.type });
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const currentFileUploaded = e.loaded;
                const otherBytes = uploadedBytes;
                const percent = Math.round(((otherBytes + currentFileUploaded) / totalBytes) * 100);
                setUploadProgress(percent);
              }
            };
            xhr.onerror = () => reject(new Error(`Network error during upload of ${f.name}`));
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                uploadedBytes += f.data.byteLength;
                setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
                resolve();
              } else {
                reject(new Error(`Failed to upload ${f.name}`));
              }
            };
            xhr.send(blob);
          } catch (err) {
            reject(err);
          }
        });
      }

      // 3) Finalize by creating the episode pointing to the playlist URL
      const finalizeRes = await fetch('/api/episode/finalize-hls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: presign.playlistPublicUrl,
          title: sharedFormData.title.trim() || 'New recording',
          status: sharedFormData.status,
          language: sharedFormData.language || '',
          description: sharedFormData.description || '',
          originalWebsite: sharedFormData.originalWebsite || '',
          duration,
          albumId: sharedFormData.albumId || undefined
        })
      });
      const finalize = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalize.error || 'Failed to save HLS episode');

      handleUploadSuccess();
      resetAfterUpload();

      await cleanupFFmpegFiles(ffmpeg);
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
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSharedFormData(prev => ({
      ...prev,
      description: '',
      originalWebsite: '',
    }));
    curSizeRef.current = 0;
    setDuration(0);
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  };

  // Update shared form data
  const updateSharedFormData = (field: keyof typeof sharedFormData, value: string | AudioStatus | Label[]) => {
    setSharedFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form data after successful upload
  const handleUploadSuccess = () => {
    setSharedFormData({
      title: '',
      status: 'draft',
      language: '',
      description: '',
      originalWebsite: '',
      albumId: '',
    });
    onUploadSuccess();
  };

  const handleProvideBlogSuccess = (blob: Blob | string | null): void => {

    setAudioBlob(oriBlob.current);

    if (blob instanceof Blob) {
      setAudioUrl(URL.createObjectURL(blob));
      oriBlob.current = blob;

    } else if (typeof blob === 'string') {
      setAudioUrl(blob); // Use the string directly
      oriBlob.current = null;

    }
  };


  const renderTabContent = () => {


    switch (activeTab) {
      case 'upload':
        return <UploadProvider onSuccess={handleProvideBlogSuccess} />;
      case 'record':
        return <RecordingProvider onSuccess={handleProvideBlogSuccess} />;
      case 'url':
        return <UrlProvider onSuccess={handleProvideBlogSuccess} />;
      default:
        return <UploadProvider onSuccess={handleProvideBlogSuccess} />;
    }
  };

  useEffect(() => {
    if (useFFmpeg) {
      loadFFmpeg();
    }
  }, [useFFmpeg]);



  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 px-4 sm:px-6" aria-label="Audio creation tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 sm:flex-none py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex flex-col  items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-lg sm:text-xl">{tab.icon}</span>
                <div className="text-center sm:text-left">
                  <div className="font-medium text-xs sm:text-sm">
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>

                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>


      {/* Tab Content with Animation */}
      <div className="p-4 sm:p-6">
        <div
          className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
        >
          {/* Active Tab Indicator */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{tabs.find(t => t.id === activeTab)?.icon}</span>
              <div>
                <div className="font-medium text-blue-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </div>
                <div className="text-sm text-blue-700">
                  {tabs.find(t => t.id === activeTab)?.description}
                </div>
              </div>
            </div>
          </div>
          {/*form */}
          {renderTabContent()}
          <div>
            <div className="space-y-6">


              {error && (
                <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
              )}
              {/* Toggle for using FFmpeg or uploading original recording */}
              {(activeTab !== 'url' && <div>
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
              )}

              {/* Output Format Selection */}
              {(useFFmpeg && activeTab !== 'url' &&
                <div>
                  {!ffmpegLoaded && (
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
                      onChange={changeFormat}
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

                  {(
                    ffmpegLoading && <div className="space-y-6">
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading FFmpeg...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}



              {/* Show current size and duration during recording */}


              {/* Processing indicator */}
              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Processing audio with FFmpeg...</p>
                </div>
              )}

              {/* Upload progress */}
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">Uploading {uploadProgress}%</div>
                </div>
              )}

              {audioUrl && (
                <div className="space-y-2">
                  <audio controls src={audioUrl} className="w-full" loop />
                  <div className="text-xs text-gray-500">
                    Type: {audioBlob?.type || 'unknown'} |
                    Size: {audioBlob ? formatFileSize(audioBlob.size) : 'unknown'} |
                    Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} |
                    Format: {outputFormat.toUpperCase()}
                  </div>

                  {/* M3U8 Content Display */}
                  {activeTab !='url'&&outputFormat === 'm3u8' && (
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

                      {useFFmpeg&&showM3U8Content && (
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
              {audioUrl && (
                <div>
                  <AudioFormFields
                    title={sharedFormData.title}
                    status={sharedFormData.status}
                    language={sharedFormData.language}
                    description={sharedFormData.description}
                    originalWebsite={sharedFormData.originalWebsite}
                    selectedAlbumId={sharedFormData.albumId}
                    onTitleChange={(title: string) => updateSharedFormData('title', title)}
                    onStatusChange={(status: AudioStatus) => updateSharedFormData('status', status)}
                    onLanguageChange={(language: string) => updateSharedFormData('language', language)}
                    onDescriptionChange={(description: string) => updateSharedFormData('description', description)}
                    onOriginalWebsiteChange={(originalWebsite: string) => updateSharedFormData('originalWebsite', originalWebsite)}
                    onAlbumChange={(albumId: string) => updateSharedFormData('albumId', albumId)}
                    showStatusHelp={true}
                    ownerId={user?.id || ''}
                  />
                </div>
              )}

              {audioUrl && (
                <button
                  disabled={isUploading}
                  onClick={uploadRecording}
                  className={`w-full px-4 py-3 rounded ${!audioBlob || isUploading
                    ? 'bg-gray-300 text-gray-600'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                  {isUploading ? 'Uploading...' : `Upload ${outputFormat.toUpperCase()} Recording`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}