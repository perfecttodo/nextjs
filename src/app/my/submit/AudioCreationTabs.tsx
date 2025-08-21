'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioStatus } from '@/types/audio';
import { useUser } from '../../hooks/useUser';
import { presignUploadSingle, presignUploadBatch } from '@/lib/presign';
import AudioFormFields from '../../components/upload/AudioFormFields';
import UploadProvider from '../../components/upload/UploadProvider';
import UrlProvider from '../../components/upload/UrlProvider';
import RecordingProvider from '../../components/upload/RecordingProvider';
import { useFfmpegEngine } from '../../components/upload/useFfmpegEngine';

interface AudioCreationTabsProps {
  onUploadSuccess: () => void;
}

type TabType = 'upload' | 'record' | 'url';

interface TabConfig {
  id: TabType;
  label: string;
  description: string;
  icon: string;
  shortLabel: string;
}

// Constants

const OUTPUT_FORMATS = ['m3u8', 'mp3', 'm4a'] as const;
type OutputFormat = typeof OUTPUT_FORMATS[number];

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
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // FFmpeg engine
  const {
    ffmpegLoaded,
    ffmpegLoading,
    loadFFmpeg,
    processBlob,
    getM3U8Content: engineGetM3U8Content,
    checkFS,
    collectHlsFiles,
    cleanupFiles,
  } = useFfmpegEngine();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('m3u8');
  const [showM3U8Content, setShowM3U8Content] = useState(false);
  const [m3u8Content, setM3u8Content] = useState<string>('');
  const [m3u8ContentLoading, setM3u8ContentLoading] = useState(false);
  const [useFFmpeg, setUseFFmpeg] = useState(false);
  const [isFormatable, setIsFormatable] = useState(false);

  const oriBlob = useRef<Blob | null>(null);

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'upload',
      label: 'Upload File',
      description: 'Upload Episodes from your device',
      icon: '📁',
      shortLabel: 'Upload'
    },
    {
      id: 'record',
      label: 'Record Audio',
      description: 'Record audio directly in your browser',
      icon: '🎙️',
      shortLabel: 'Record'
    },
    {
      id: 'url',
      label: 'Audio URL',
      description: 'Submit audio from external URLs',
      icon: '🔗',
      shortLabel: 'URL'
    }
  ];

  // Memoized callbacks
  const getM3U8Content = useCallback(async (): Promise<string> => {
    if (outputFormat !== 'm3u8') return 'FFmpeg not available';
    return engineGetM3U8Content();
  }, [engineGetM3U8Content, outputFormat]);

  const processRecording = useCallback(async (format: OutputFormat) => {
    if (!oriBlob.current) return;

    // Default to original blob preview
    setAudioBlob(oriBlob.current);
    setAudioUrl(URL.createObjectURL(oriBlob.current));

    if (useFFmpeg && ffmpegLoaded) {
      try {
        setIsProcessing(true);
        const processed = await processBlob(oriBlob.current, format);
        setAudioBlob(processed);
        // For m3u8, keep previewing the original blob; otherwise preview processed
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const preview = format === 'm3u8' ? oriBlob.current : processed;
        setAudioUrl(URL.createObjectURL(preview));
      } catch (e) {
        console.error('FFmpeg processing error:', e);
        setError('Failed to process audio. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [audioUrl, ffmpegLoaded, processBlob, useFFmpeg]);


  useEffect(()=>{
    setIsFormatable(activeTab!='url' && audioBlob!=null);
  },[audioUrl,audioBlob,activeTab])

  useEffect(()=>{
    setAudioUrl('');
    setAudioBlob(null)
  },[activeTab]);



  const changeFormat = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as OutputFormat;
    setOutputFormat(newFormat);
    await new Promise(resolve => setTimeout(resolve, 100));
    await processRecording(newFormat);
  }, [processRecording]);

  // removed inline FFmpeg processing in favor of hook

  

  const uploadStandardEpisode = useCallback(async () => {

    let finalUrl;
    if(activeTab!='url'){



    if (!audioBlob) {
      throw new Error('No data available for upload');
    }
    
    const ext = outputFormat;
    const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    const file = new File([audioBlob], `episode.${ext}`, { type: mimeType });

    // 1) Request presigned URL
    const presign = await presignUploadSingle(file.name, file.type);

    // 2) Upload file directly to R2 via PUT
    const putRes = await new Promise<Response>((resolve, reject) => {
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
      
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.send(file);
    });
    
    if (!putRes.ok) throw new Error('Direct upload to storage failed');
    finalUrl =presign.publicUrl;

  }else finalUrl = audioUrl;
    // 3) Finalize by creating episode using the public URL
    const finalizeRes = await fetch('/api/episode/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: finalUrl,
        title: sharedFormData.title.trim() || 'New recording',
        status: sharedFormData.status,
        language: sharedFormData.language || '',
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
  }, [activeTab, audioBlob, audioUrl, duration, outputFormat, sharedFormData]);




  const uploadHLSRecording = useCallback(async () => {
    try {
      const fsHealthy = await checkFS();
      if (!fsHealthy) {
        throw new Error('FFmpeg file system is not healthy. Please try refreshing the page.');
      }

      // Gather files from FFmpeg FS via engine
      const filesToUpload = await collectHlsFiles();

      // 1) Ask server for presigned URLs for all files
      const presign = await presignUploadBatch(
        sharedFormData.title.trim() || 'New recording',
        filesToUpload.map(f => ({ name: f.name, contentType: f.type }))
      );

      // 2) Upload each file via PUT
      const nameToUploadUrl = new Map<string, string>(
        presign.files.map((f: any) => [f.name, f.uploadUrl])
      );
      
      let uploadedBytes = 0;
      const totalBytes = filesToUpload.reduce((sum, file) => sum + file.data.byteLength, 0);
      
      for (const f of filesToUpload) {
        const uploadUrl = nameToUploadUrl.get(f.name);
        if (!uploadUrl) throw new Error(`Missing upload URL for ${f.name}`);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', f.type);
          const arrayBuffer = f.data.buffer.slice(
            f.data.byteOffset,
            f.data.byteOffset + f.data.byteLength
          ) as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: f.type });
          
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
          
          xhr.onabort = () => reject(new Error(`Upload of ${f.name} aborted`));
          xhr.send(blob);
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
      await cleanupFiles();
    } catch (error) {
      console.error('HLS upload error:', error);
      throw new Error(`Failed to upload HLS files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [sharedFormData, duration, checkFS, collectHlsFiles, cleanupFiles]);

  // removed inline FS helpers in favor of hook

  const resetAfterUpload = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSharedFormData(prev => ({
      ...prev,
      description: '',
      originalWebsite: '',
    }));
    setDuration(0);
  }, [audioUrl]);

  const submitEpisode = useCallback(async () => {
    if (!audioUrl) {
      setError('Please record or upload audio before uploading.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError('');
      
      if (activeTab!='url'&&outputFormat === 'm3u8') {
        await uploadHLSRecording();
      } else {
        await uploadStandardEpisode();
      }

      setAudioBlob(null);
      setAudioUrl('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [audioUrl, outputFormat, activeTab, uploadHLSRecording, uploadStandardEpisode]);

  const handleTabChange = useCallback((newTab: TabType) => {
    if (newTab === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  }, [activeTab]);

  const updateSharedFormData = useCallback((field: keyof typeof sharedFormData, value: string | AudioStatus) => {
    setSharedFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setSharedFormData({
      title: '',
      status: 'draft',
      language: '',
      description: '',
      originalWebsite: '',
      albumId: '',
    });
    onUploadSuccess();
  }, [onUploadSuccess]);

  const handleProvideBlogSuccess = useCallback((blob: Blob | string | null): void => {
    if (blob instanceof Blob) {
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      oriBlob.current = blob;
    } else if (typeof blob === 'string') {
      setAudioUrl(blob);
      oriBlob.current = null;
    }
  }, []);

  const renderTabContent = useCallback(() => {
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
  }, [activeTab, handleProvideBlogSuccess]);

  // Effects
  useEffect(() => {
    if (useFFmpeg) {
      loadFFmpeg();
    }
  }, [useFFmpeg, loadFFmpeg]);

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
              className={`flex-1 sm:flex-none py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center space-y-1 sm:space-y-0 sm:space-x-2">
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
        <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
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
          
          {/* Form */}
          {renderTabContent()}
          
          <div className="space-y-6">
            {error && (
              <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
            )}
            
            {/* Toggle for using FFmpeg or uploading original recording */}

            {isFormatable && (
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
            )}

            {/* Output Format Selection */}
            {useFFmpeg && isFormatable && (
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
                )}
                
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

                {ffmpegLoading && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading FFmpeg...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
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
                  Duration: {formatDuration(duration)} |
                  Format: {outputFormat.toUpperCase()}
                </div>

                {/* M3U8 Content Display */}
                {activeTab !== 'url' && outputFormat === 'm3u8' && (
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

                    {useFFmpeg && showM3U8Content && (
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
                onClick={submitEpisode}
                className={`w-full px-4 py-3 rounded ${
                  !audioUrl || isUploading
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors duration-200`}
              >
                {isUploading ? 'Uploading...' : `Upload`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}