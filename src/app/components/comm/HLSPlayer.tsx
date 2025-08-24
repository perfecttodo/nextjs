// HLSPlayer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import { Episode } from '@/types/audio';
import { formatDuration } from '@/lib/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';

interface HLSPlayerProps {}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const videoJsPlayerRef = useRef<any>(null);

    const [url, setUrl] = useState<string>();

    const {
        audio,
        play,
        pause,
        ended,
        setAudio,
        currentIndex, 
        setStatus, 
        isToggle, 
        currentTime,
        setCurrentTime,
        setDuration,
        duration, 
        playMode,
    } = useAudioPlayerStore();

    // Memoize event handlers to prevent unnecessary re-renders
    const onEnded = useCallback(() => {
        ended();
    }, [ended]);

    const onPlay = useCallback(() => {
        handleLoadedMetadata();
        setStatus('loaded');
        console.log('onPlay');
        play();
    }, [setStatus, play]);

    const onPause = useCallback(() => {
        console.log('onPause');
        pause();
    }, [pause]);

    const onError = useCallback((error: string) => {
        console.log('onError' + error);
        setStatus('error');
    }, [setStatus]);

    const isHlsSupportFormat = useCallback((): boolean => {
        return audio?.format != null && 
               (audio?.format.indexOf('m3u8') > -1 || 
                audio?.format.indexOf('mpegurl') > -1);
    }, [audio?.format]);

    const handleTimeUpdate = useCallback(() => {
        if (videoJsPlayerRef.current) {
            const time = videoJsPlayerRef.current.currentTime();
            if (typeof time === 'number') {
                setCurrentTime(time);
                const playerDuration = videoJsPlayerRef.current.duration();
                if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
                    onEnded();
                }
            }
        } else if (videoRef.current) {
            const time = videoRef.current.currentTime;
            if (typeof time === 'number') {
                setCurrentTime(time);
                const playerDuration = videoRef.current.duration;
                if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
                    onEnded();
                }
            }
        }
    }, [setCurrentTime, onEnded]);

    const handleLoadedMetadata = useCallback(() => {
        if (videoJsPlayerRef.current) {
            const dur = videoJsPlayerRef.current.duration();
            if (typeof dur === 'number') setDuration(dur);
        } else if (videoRef.current) {
            const dur = videoRef.current.duration;
            if (typeof dur === 'number') setDuration(dur);
        }
        setStatus('loaded');
    }, [setDuration, setStatus]);

    // Seek handler
    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoJsPlayerRef.current) {
            videoJsPlayerRef.current.currentTime(time);
        } else if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
        setCurrentTime(time);
    }, [setCurrentTime]);

    const getType = useCallback((audio: Episode) => {
        switch (audio.format) {
            case 'mp3':
                return 'audio/mp3';
            case 'm4a':
                return 'audio/mp4';
            case 'm3u8':
                return 'application/x-mpegURL';
            case 'mpd':
                return 'application/dash+xml';
            default:
                return audio.format;
        }
    }, []);

    useEffect(() => {
        console.log('audio', audio);
        setUrl(audio?.blobUrl);
    }, [audio]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isHlsSupportFormat()) {
            if (video.paused) {
                video.play().catch(error => onError(error.message));
            } else {
                video.pause();
            }
        } else if (videoJsPlayerRef.current) {
            if (videoJsPlayerRef.current.paused()) {
                videoJsPlayerRef.current.play().catch(error => onError(error.message));
            } else {
                videoJsPlayerRef.current.pause();
            }
        }
    }, [isToggle, isHlsSupportFormat, onError]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !url) return;

        setStatus('loading');

        if (isHlsSupportFormat()) {
            if (Hls.isSupported()) {
                // Clean up existing HLS instance if any
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                hlsRef.current = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                
                hlsRef.current.attachMedia(video);
                
                hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(error => onError(error.message));
                    handleLoadedMetadata();
                });

                hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    if (data.fatal) {
                        onError(`HLS Error: ${data.type}`);
                    }
                });

                hlsRef.current.loadSource(url);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = url;
                video.addEventListener('loadedmetadata', handleLoadedMetadata);
                video.play().catch(error => onError(error.message));
            } else {
                onError('HLS is not supported in this browser');
            }
        } else {
            // Clean up existing video.js instance if any
            if (videoJsPlayerRef.current) {
                videoJsPlayerRef.current.dispose();
                videoJsPlayerRef.current = null;
            }

            // Initialize video.js player
            videoJsPlayerRef.current = videojs(video, {
                html5: {
                    vhs: {
                        enableLowInitialPlaylist: true,
                        smoothQualityChange: true,
                        overrideNative: true
                    }
                },
                controls: false,
                autoplay: false,
                preload: 'metadata',
                fluid: true,
                responsive: true,
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                controlBar: {
                    children: []
                }
            });

            videoJsPlayerRef.current.on('loadedmetadata', handleLoadedMetadata);
            videoJsPlayerRef.current.on('timeupdate', handleTimeUpdate);
            videoJsPlayerRef.current.on('error', () => {
                onError('Video.js player error');
            });

            if (audio) {
                const type = getType(audio);
                videoJsPlayerRef.current.src({
                    src: url,
                    type
                });
                
                videoJsPlayerRef.current.play().catch(error => onError(error.message));
            }
        }

        // Add event listeners for native video element
        video.addEventListener('ended', onEnded);
        video.addEventListener('pause', onPause);
        video.addEventListener('play', onPlay);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            // Clean up HLS
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // Clean up video.js
            if (videoJsPlayerRef.current) {
                videoJsPlayerRef.current.off('loadedmetadata', handleLoadedMetadata);
                videoJsPlayerRef.current.off('timeupdate', handleTimeUpdate);
                videoJsPlayerRef.current.dispose();
                videoJsPlayerRef.current = null;
            }

            // Clean up native event listeners
            if (video) {
                video.removeEventListener('ended', onEnded);
                video.removeEventListener('pause', onPause);
                video.removeEventListener('play', onPlay);
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            }
        };
    }, [url, audio, isHlsSupportFormat, onEnded, onPause, onPlay, handleTimeUpdate, handleLoadedMetadata, onError, getType]);

    return (
        <div>
            <div className="absolute -top-1 left-0 right-0">
                <div className="flex items-center px-2 text-xs text-gray-500">
                    <span className="w-10 text-right">{formatDuration(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 mx-2 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`
                        }}
                    />
                    <span className="w-10 text-left">{formatDuration(duration)}</span>
                </div>
            </div>
            <div className='hidden'>
                <video 
                    ref={videoRef} 
                    className="video-js vjs-default-skin" 
                    controls 
                    playsInline 
                    webkit-playsinline="true" 
                />
            </div>
        </div>
    );
};

export default HLSPlayer;