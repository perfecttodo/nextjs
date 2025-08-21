import { useCallback } from 'react';
import { presignUploadSingle, presignUploadBatch } from '@/lib/presign';
import { SharedFormData } from './types';
import { useFfmpegEngine } from '@/app/components/upload/useFfmpegEngine';

export const useAudioUpload = (
  ffmpegEngine: ReturnType<typeof useFfmpegEngine>,
  updateProgress: (progress: number) => void,
  setError: (error: string) => void
) => {
  const uploadStandardEpisode = useCallback(async (
    audioBlob: Blob | null,
    outputFormat: string,
    audioUrl: string | null,
    sharedFormData: SharedFormData,
    duration: number,
    activeTab: string
  ) => {
    let finalUrl;

    if (activeTab !== 'url') {
      if (!audioBlob) {
        throw new Error('No data available for upload');
      }
      
      const ext = outputFormat;
      const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      const file = new File([audioBlob], `episode.${ext}`, { type: mimeType });

      const presign = await presignUploadSingle(file.name, file.type);
      const putRes = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            updateProgress(percent);
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
    } else {
      finalUrl = audioUrl;
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
        duration,
        albumId: sharedFormData.albumId || undefined,
        format: sharedFormData.format || undefined,
      })
    });
    
    const finalizeData = await finalizeRes.json();
    if (!finalizeRes.ok) throw new Error(finalizeData.error || 'Failed to save episode');
  }, [updateProgress]);

  const uploadHLSRecording = useCallback(async (
    sharedFormData: SharedFormData,
    duration: number
  ) => {
    try {
      const fsHealthy = await ffmpegEngine.checkFS();
      if (!fsHealthy) {
        throw new Error('FFmpeg file system is not healthy. Please try refreshing the page.');
      }

      const filesToUpload = await ffmpegEngine.collectHlsFiles();
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
              updateProgress(percent);
            }
          };
          
          xhr.onerror = () => reject(new Error(`Network error during upload of ${f.name}`));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadedBytes += f.data.byteLength;
              updateProgress(Math.round((uploadedBytes / totalBytes) * 100));
              resolve();
            } else {
              reject(new Error(`Failed to upload ${f.name}`));
            }
          };
          
          xhr.onabort = () => reject(new Error(`Upload of ${f.name} aborted`));
          xhr.send(blob);
        });
      }

      const finalizeRes = await fetch('/api/episode/upload-url', {
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
      await ffmpegEngine.cleanupFiles();
    } catch (error) {
      console.error('HLS upload error:', error);
      throw new Error(`Failed to upload HLS files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [ffmpegEngine, updateProgress]);

  return {
    uploadStandardEpisode,
    uploadHLSRecording,
  };
};