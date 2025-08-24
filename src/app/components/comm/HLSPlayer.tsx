// HLSPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import { Episode } from '@/types/audio';
import { formatDuration } from '@/lib/audio';

import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
interface HLSPlayerProps {

}
function getType(audio: Episode) {
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
}

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
        currentIndex, setStatus, isToggle, currentTime, setCurrentTime, setDuration,
        duration, playMode,

    } = useAudioPlayerStore();

    const onEnded = () => {
        ended();
    }
    const onPlay = () => {
        handleLoadedMetadata();
        setStatus('loaded');
        console.log('onPlay')
        play();

    }
    const onPause = () => {
        console.log('onPause')
        pause();
    }
    const onError = (error: string) => {
        console.log('onError' + error)
    }
    const isHlsSupportFormat = (): boolean => {
        return audio?.format != null && (audio?.format.indexOf('m3u8') > -1 || audio?.format.indexOf('mpegurl') > -1);
    }
    const handleTimeUpdate = () => {
        if (isHlsSupportFormat()) {
            if (videoRef.current == null) return;
            const time = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            if (typeof time === 'number') {
                setCurrentTime(time);
                const playerDuration = videoRef.current;
                if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
                    onEnded();
                }
                const dur = duration;
                if (typeof dur === 'number') setDuration(dur);
            }
        } else {
            const time = videoJsPlayerRef.current.currentTime();
            if (typeof time === 'number') {
                setCurrentTime(time);
                const playerDuration = videoJsPlayerRef.current.duration();
                if (typeof playerDuration === 'number' && time >= playerDuration - 0.1) {
                    onEnded();
                }
            }
        }

    };

    const handleLoadedMetadata = () => {
        if (isHlsSupportFormat()) {
            const dur = videoRef.current ? videoRef.current.duration : undefined;

            if (typeof dur === 'number') setDuration(dur);
        } else {
            if (videoJsPlayerRef.current) {
                const dur = videoJsPlayerRef.current.duration();
                if (typeof dur === 'number') setDuration(dur);
            }
        }
        setStatus('loaded');

    };
    // Seek handler
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (isHlsSupportFormat()) {
            if (videoRef.current == null) return;
            videoRef.current.currentTime = time;
        } else if (videoRef.current) {
            videoJsPlayerRef.current.currentTime(time);

        }
    };

    useEffect(() => {
        console.log('audio', audio)
        setUrl(audio?.blobUrl);

    }, [audio]);


    useEffect(() => {
        if (isHlsSupportFormat()) {
            const video = videoRef.current;
            if (video == null) return;
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        } else if (videoJsPlayerRef.current) {
            if (videoJsPlayerRef.current.paused()) {
                videoJsPlayerRef.current.play();
                play();

            } else {
                videoJsPlayerRef.current.pause();
                pause();
            }
        }


    }, [isToggle]);

    useEffect(() => {
        if (url) {
            setStatus('');

            if (isHlsSupportFormat()) {
                const video = videoRef.current;
                if (video == null) return;
                if (Hls.isSupported() && !hlsRef.current) {
                    hlsRef.current = new Hls();
                    hlsRef.current.attachMedia(video);
                    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play();
                        handleLoadedMetadata();
                    });

                    hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            onError(`HLS Error: ${data.fatal}`);
                        }
                    });

                    video.addEventListener('ended', onEnded);
                    video.addEventListener('pause', onPause);
                    video.addEventListener('play', onPlay);
                    video.addEventListener('timeupdate', handleTimeUpdate);
                }
                if (url) {
                    if (hlsRef.current) {
                        hlsRef.current.loadSource(url);

                    } else {
                        video.src = url; // Fallback for native support
                    }
                }
            } else {

                if (videoRef.current) {

                    videoJsPlayerRef.current = videojs(videoRef.current, {
                        html5: {
                            vhs: {
                                enableLowInitialPlaylist: true,
                                smoothQualityChange: true,
                                overrideNative: true
                            }
                        },
                        controls: false,
                        autoplay: true,
                        preload: 'auto',
                    });

                    videoJsPlayerRef.current.on('loadedmetadata', onPlay);
                    videoJsPlayerRef.current.on('timeupdate', handleTimeUpdate);

                    if (audio != null) {
                        let type = getType(audio);
                        videoJsPlayerRef.current.src({ src: url, type });
                        videoJsPlayerRef.current.play();
                    }
                }
            }
        }

        return () => {

            if (isHlsSupportFormat()) {
                const video = videoRef.current;

                if (hlsRef.current && video) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                    video.removeEventListener('ended', onEnded);
                    video.removeEventListener('pause', onPause);
                }
            } else {
                if (videoJsPlayerRef.current) {
                    videoJsPlayerRef.current.off('loadedmetadata', onPlay);
                    videoJsPlayerRef.current.off('timeupdate', handleTimeUpdate);
                    videoJsPlayerRef.current.dispose();
                    videoJsPlayerRef.current = null;

                }
            }



        };
    }, [url]);

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
                <video ref={videoRef} className="video-js vjs-default-skin" controls playsInline webkit-playsinline="true" />
            </div>
        </div>
    );
};

export default HLSPlayer;