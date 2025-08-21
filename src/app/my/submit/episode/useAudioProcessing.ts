import { useState, useCallback, useRef } from 'react';
import { AudioProcessingState, OutputFormat } from './types';
import { useFfmpegEngine } from '@/app/components/upload/useFfmpegEngine';

export const useAudioProcessing = () => {
  const [state, setState] = useState<AudioProcessingState>({
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

  const oriBlob = useRef<Blob | null>(null);
  const ffmpegEngine = useFfmpegEngine();

  const updateState = useCallback((updates: Partial<AudioProcessingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleProvideBlogSuccess = useCallback((blob: Blob | string | null): void => {
    if (blob instanceof Blob) {
      updateState({ 
        audioBlob: blob, 
        audioUrl: URL.createObjectURL(blob) 
      });
      oriBlob.current = blob;
    } else if (typeof blob === 'string') {
      updateState({ 
        audioUrl: blob,
        audioBlob: null 
      });
      oriBlob.current = null;
    }
  }, [updateState]);

  const processConvert = useCallback(async (format: OutputFormat) => {
    if (!oriBlob.current) return;

    updateState({ audioBlob: oriBlob.current, audioUrl: URL.createObjectURL(oriBlob.current) });

    if (state.useFFmpeg && ffmpegEngine.ffmpegLoaded) {
      try {
        updateState({ isProcessing: true });
        const processed = await ffmpegEngine.convertBlobToformat(oriBlob.current, format);
        updateState({ audioBlob: processed });
        
        if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
        const preview = format === 'm3u8' ? oriBlob.current : processed;
        updateState({ audioUrl: URL.createObjectURL(preview) });
        
      } catch (e) {
        console.error('FFmpeg processing error:', e);
        updateState({ error: 'Failed to process audio. Please try again.' });
      } finally {
        updateState({ isProcessing: false });
      }
    }
  }, [state.useFFmpeg, state.audioUrl, ffmpegEngine, updateState]);

  const changeFormat = useCallback(async (newFormat: OutputFormat) => {
    updateState({ outputFormat: newFormat });
    await processConvert(newFormat);
  }, [processConvert, updateState]);

  return {
    state,
    updateState,
    handleProvideBlogSuccess,
    processConvert,
    changeFormat,
    oriBlob,
    ffmpegEngine,
  };
};