'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '../../../hooks/useUser';
import { presignUploadSingle, presignUploadBatch } from '@/lib/presign';
import EpisodeForm from './EpisodeForm';
import UploadProvider from './upload/UploadProvider';
import UrlProvider from './upload/UrlProvider';
import RecordingProvider from './upload/RecordingProvider';
import { useFfmpegEngine } from './upload/useFfmpegEngine';
import { formatFileSize, formatDuration } from '@/lib/audio';
import TabNavigation from './TabNavigation';
import {
  AudioCreationTabsProps,
  TabType,
  TabConfig,
  SharedFormData,
  OutputFormat,
  AudioProcessingState
} from './types';

const TABS: TabConfig[] = [
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

export default function AudioCreationTabs({ onUploadSuccess }: AudioCreationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading: userLoading } = useUser();

  const [sharedFormData, setSharedFormData] = useState<SharedFormData>({
    title: '',
    status: 'draft',
    language: '',
    description: '',
    originalWebsite: '',
    albumId: '',
    format: '',
    url: '',
  });
  // Audio state using the new interface
  const [audioState, setAudioState] = useState<AudioProcessingState>({
    audioBlob: null,
    audioUrl: null,
    error: '',
    isUploading: false,
    isProcessing: false,
    uploadProgress: 0,
    duration: 0,
    outputFormat: 'm3u8',
    showM3U8Content: false,
    m3u8Content: '',
    m3u8ContentLoading: false,
    useFFmpeg: false,
    isFormatable: false,
  });

  // FFmpeg engine
  const {
    ffmpegLoaded,
    ffmpegLoading,
    loadFFmpeg,
    convertBlobToformat,
    getM3U8Content: engineGetM3U8Content,
    checkFS,
    collectHlsFiles,
    cleanupFiles,
  } = useFfmpegEngine();

  const oriBlob = useRef<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper function to update audio state
  const updateAudioState = useCallback((updates: Partial<AudioProcessingState>) => {
    setAudioState(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoized callbacks
  const getM3U8Content = useCallback(async (): Promise<string> => {
    if (audioState.outputFormat !== 'm3u8') return 'FFmpeg not available';
    return engineGetM3U8Content();
  }, [engineGetM3U8Content, audioState.outputFormat]);

  const processConvert = useCallback(async (format: OutputFormat) => {
    if (!oriBlob.current) return;

    updateAudioState({ 
      audioBlob: oriBlob.current, 
      audioUrl: URL.createObjectURL(oriBlob.current) 
    });

    if (audioState.useFFmpeg && ffmpegLoaded) {
      try {
        updateAudioState({ isProcessing: true });
        const processed = await convertBlobToformat(oriBlob.current, format);
        updateAudioState({ audioBlob: processed });
        
        if (audioState.audioUrl) URL.revokeObjectURL(audioState.audioUrl);
        const preview = format === 'm3u8' ? oriBlob.current : processed;
        updateAudioState({ audioUrl: URL.createObjectURL(preview) });
        
      } catch (e) {
        console.error('FFmpeg processing error:', e);
        updateAudioState({ error: 'Failed to process audio. Please try again.' });
      } finally {
        updateAudioState({ isProcessing: false });
      }
    }
  }, [audioState.useFFmpeg, audioState.audioUrl, ffmpegLoaded, convertBlobToformat, updateAudioState]);

  useEffect(() => {
    updateAudioState({ 
      isFormatable: activeTab !== 'url' && audioState.audioBlob !== null 
    });
  }, [activeTab, audioState.audioBlob, updateAudioState]);

  useEffect(() => {
    updateAudioState({ audioUrl: '', audioBlob: null });
  }, [activeTab, updateAudioState]);

  const changeFormat = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as OutputFormat;
    updateAudioState({ outputFormat: newFormat });
    await new Promise(resolve => setTimeout(resolve, 100));
    await processConvert(newFormat);
  }, [processConvert, updateAudioState]);

  const uploadStandardEpisode = useCallback(async () => {
    let finalUrl;
      if (!audioState.audioBlob) {
        throw new Error('No data available for upload');
      }
      
      const ext = audioState.outputFormat;
      const mimeType = audioState.outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      const file = new File([audioState.audioBlob], `episode.${ext}`, { type: mimeType });

      const presign = await presignUploadSingle(file.name, file.type);

      const putRes = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            updateAudioState({ uploadProgress: percent });
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
      finalUrl = presign.publicUrl;
   

    return finalUrl

  }, [activeTab, audioState.audioBlob, audioState.audioUrl, audioState.duration, audioState.outputFormat, sharedFormData, updateAudioState]);

  const uploadHLSRecording = useCallback(async () => {
    try {
      const fsHealthy = await checkFS();
      if (!fsHealthy) {
        throw new Error('FFmpeg file system is not healthy. Please try refreshing the page.');
      }

      const filesToUpload = await collectHlsFiles();
      const presign = await presignUploadBatch(
        sharedFormData.title.trim() || 'New recording',
        filesToUpload.map(f => ({ name: f.name, contentType: f.type }))
      );

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
              updateAudioState({ uploadProgress: percent });
            }
          };
          
          xhr.onerror = () => reject(new Error(`Network error during upload of ${f.name}`));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadedBytes += f.data.byteLength;
              updateAudioState({ uploadProgress: Math.round((uploadedBytes / totalBytes) * 100) });
              resolve();
            } else {
              reject(new Error(`Failed to upload ${f.name}`));
            }
          };
          
          xhr.onabort = () => reject(new Error(`Upload of ${f.name} aborted`));
          xhr.send(blob);
        });
      }

      return presign.playlistPublicUrl;


    } catch (error) {
      console.error('HLS upload error:', error);
      throw new Error(`Failed to upload HLS files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [sharedFormData, audioState.duration, checkFS, collectHlsFiles, cleanupFiles, updateAudioState]);

  const resetAfterUpload = useCallback(() => {
    updateAudioState({ 
      audioBlob: null,
      audioUrl: null
    });
    if (audioState.audioUrl) URL.revokeObjectURL(audioState.audioUrl);
    setSharedFormData(prev => ({
      ...prev,
      description: '',
      originalWebsite: '',
    }));
    updateAudioState({ duration: 0 });
  }, [audioState.audioUrl, updateAudioState]);

  const submitEpisode = useCallback(async () => {
    if (!audioState.audioUrl) {
      updateAudioState({ error: 'Please record or upload audio before uploading.' });
      return;
    }

    try {
      updateAudioState({ isUploading: true, uploadProgress: 0, error: '' });
      let finalUrl = audioState.audioUrl;
      const isHls = activeTab !== 'url' && audioState.outputFormat === 'm3u8';

      if(activeTab !== 'url'){
        if (isHls) {
          finalUrl = await uploadHLSRecording()||'';
        } else {
          finalUrl = await uploadStandardEpisode();
        }
      }


      const finalizeRes = await fetch('/api/episode/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sharedFormData.url || finalUrl,
          title: sharedFormData.title.trim(),
          status: sharedFormData.status,
          language: sharedFormData.language || '',
          description: sharedFormData.description || '',
          originalWebsite: sharedFormData.originalWebsite || '',
          duration: audioState.duration,
          albumId: sharedFormData.albumId || undefined,
          format: sharedFormData.format || undefined,
        })
      });
      
      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalizeData.error || 'Failed to save episode');
  
      handleUploadSuccess();
      resetAfterUpload();

      if (isHls) await cleanupFiles();

      updateAudioState({ audioBlob: null, audioUrl: '' });
    } catch (e) {
      updateAudioState({ error: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      updateAudioState({ isUploading: false, uploadProgress: 0 });
    }
  }, [audioState.audioUrl, audioState.outputFormat, activeTab, uploadHLSRecording, uploadStandardEpisode, updateAudioState]);

  const handleTabChange = useCallback((newTab: TabType) => {
    if (newTab === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  }, [activeTab]);

  const handleAudioFieldsChange = useCallback((patch: Partial<SharedFormData>) => {
    setSharedFormData(prev => ({ ...prev, ...patch }));
    if (patch.url !== undefined) {
      const newUrl = patch.url || '';
      updateAudioState({ audioUrl: newUrl || null });
      oriBlob.current = null;
    }
  }, [updateAudioState]);

  const handleUploadSuccess = useCallback(() => {
    setSharedFormData({
      title: '',
      status: 'draft',
      language: '',
      description: '',
      originalWebsite: '',
      albumId: '',
      format: '',
      url: '',
    });
    onUploadSuccess();
  }, [onUploadSuccess]);

  const handleProvideBlogSuccess = useCallback((blob: Blob | string | null): void => {
    if (blob instanceof Blob) {
      updateAudioState({ 
        audioBlob: blob, 
        audioUrl: URL.createObjectURL(blob) 
      });
      oriBlob.current = blob;
    } else if (typeof blob === 'string') {
      updateAudioState({ 
        audioUrl: blob,
        audioBlob: null 
      });
      oriBlob.current = null;
    }
  }, [updateAudioState]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'upload':
        return <UploadProvider onSuccess={handleProvideBlogSuccess}  />;
      case 'record':
        return <RecordingProvider onSuccess={handleProvideBlogSuccess} onStart={()=>{ audioRef.current?.pause()}} />;
      case 'url':
        return <UrlProvider onSuccess={handleProvideBlogSuccess} />;
      default:
        return <UploadProvider onSuccess={handleProvideBlogSuccess} />;
    }
  }, [activeTab, handleProvideBlogSuccess]);

  useEffect(() => {
    if (audioState.useFFmpeg) {
      loadFFmpeg();
    }
  }, [audioState.useFFmpeg, loadFFmpeg]);

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
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isTransitioning={isTransitioning}
      />

      <div className="p-4 sm:p-6">
        <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {renderTabContent()}
          
          <div className="space-y-6">
            {audioState.error && (
              <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
                {audioState.error}
              </div>
            )}
            
            {audioState.isFormatable && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={audioState.useFFmpeg}
                    onChange={(e) => updateAudioState({ useFFmpeg: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Use FFmpeg for conversion</span>
                </label>
              </div>
            )}

            {audioState.useFFmpeg && audioState.isFormatable && (
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
                    value={audioState.outputFormat}
                    onChange={changeFormat}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="m3u8">M3U8 (HLS Streaming)</option>
                    <option value="mp3">MP3</option>
                    <option value="m4a">M4A (AAC)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {audioState.outputFormat === 'm3u8' && 'HLS format for streaming, creates multiple segments'}
                    {audioState.outputFormat === 'mp3' && 'MP3 format for compatibility'}
                    {audioState.outputFormat === 'm4a' && 'M4A format with AAC codec for quality'}
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

            {audioState.isProcessing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Processing audio with FFmpeg...</p>
              </div>
            )}

            {audioState.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${audioState.uploadProgress}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">Uploading {audioState.uploadProgress}%</div>
              </div>
            )}

            {audioState.audioUrl && (
              <div className="space-y-2">
                <audio controls src={audioState.audioUrl} className="w-full" loop ref={audioRef} />
                <div className="text-xs text-gray-500">
                  Type: {audioState.audioBlob?.type || 'unknown'} |
                  Size: {audioState.audioBlob ? formatFileSize(audioState.audioBlob.size) : 'unknown'} |
                  Duration: {formatDuration(audioState.duration)} |
                  Format: {audioState.outputFormat.toUpperCase()}
                </div>

                {activeTab !== 'url' && audioState.outputFormat === 'm3u8' && (
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        if (!audioState.showM3U8Content) {
                          updateAudioState({ m3u8ContentLoading: true });
                          const content = await getM3U8Content();
                          updateAudioState({ m3u8Content: content, m3u8ContentLoading: false });
                        }
                        updateAudioState({ showM3U8Content: !audioState.showM3U8Content });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                      disabled={audioState.m3u8ContentLoading}
                    >
                      {audioState.m3u8ContentLoading ? 'Loading...' : (audioState.showM3U8Content ? 'Hide' : 'Show')} M3U8 Content
                    </button>

                    {audioState.useFFmpeg && audioState.showM3U8Content && (
                      <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                        <div className="text-gray-600 mb-2">M3U8 Playlist Content:</div>
                        <pre className="whitespace-pre-wrap break-words">
                          {audioState.m3u8Content}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {audioState.audioUrl && (
              <div>
                <EpisodeForm
                  audio={{
                    id: '',
                    title: sharedFormData.title,
                    blobUrl: sharedFormData.url || '',
                    status: sharedFormData.status,
                    language: sharedFormData.language,
                    description: sharedFormData.description,
                    originalWebsite: sharedFormData.originalWebsite,
                    albumId: sharedFormData.albumId,
                    format: sharedFormData.format,
                  }}
                  onChange={handleAudioFieldsChange}
                  showStatusHelp={true}
                  ownerId={user?.id || ''}
                />
              </div>
            )}

            {audioState.audioUrl && (
              <button
                disabled={audioState.isUploading}
                onClick={submitEpisode}
                className={`w-full px-4 py-3 rounded ${
                  !audioState.audioUrl || audioState.isUploading
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors duration-200`}
              >
                {audioState.isUploading ? 'Uploading...' : `Upload`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}