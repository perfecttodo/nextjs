// HLSPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import { Episode } from '@/types/audio';
import { formatDuration } from '@/lib/audio';
import { Parser } from "m3u8-parser";

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
        case 'application/mp4':
                return 'audio/mp4';
        case 'mpd':
            return 'application/dash+xml';
        default:
            return audio.format;
    }
}

 async function getAudioUrl(url: string) {

   const response = await fetch('/api/episode/detect?url=' + encodeURIComponent(url));
   const data = await response.json(); // Parse the response as JSON

   if(data?.format !== 'm3u8') { return url; }

    let manifest = await fetch(url).then((r) => r.text());
    let parser = new Parser();

    parser.push(manifest);
    parser.end();

    const parsedManifest = parser.manifest;

    // Check for segments containing '.aac' in their URI
    if (parsedManifest.segments && parsedManifest.segments.length > 0) {
        const hasAAC = parsedManifest.segments.some(e => e.uri.includes('.aac'));
        if (hasAAC) {
            return url;
        }
    }

    // Access audio media groups
    const audioGroup = parsedManifest.mediaGroups ? parsedManifest.mediaGroups.AUDIO : undefined;
    
    if (!audioGroup) {
        return url; // Return null if no audio group is found
    }

    // Extract the audio URI
    const audio = JSON.stringify(audioGroup).replace(/[{}]/g, "").trim();
    const match = audio.match(/uri":\s*"(.*?)"/);

    if (match && match.length > 1) {
        return  url + "/../" + match[1];
    } 
    return url;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videojsRef = useRef<HTMLVideoElement>(null);
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
            }

            const dur = duration;
            if (typeof dur === 'number') setDuration(dur);

        } else {
            const time = videoJsPlayerRef.current.currentTime();
            if (typeof time === 'number') {
                setCurrentTime(time);
                const duration = videoJsPlayerRef.current.duration();
                    const dur = duration;
                    if (typeof dur === 'number') setDuration(dur);
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

    useEffect( () => {
        (async()=>{

            if (url) {
                const theUrl = await getAudioUrl(url);
                setStatus('');
    
                if (isHlsSupportFormat()) {
    
                    if(videoJsPlayerRef.current)videoJsPlayerRef.current.pause();
    
                    const video = videoRef.current;
                    if (video == null) return;
                    if (Hls.isSupported() && !hlsRef.current) {
                        hlsRef.current = new Hls({
                        // Buffering optimization settings
                        maxBufferLength: 30,          // Maximum buffer length in seconds
                        maxMaxBufferLength: 60,       // Absolute maximum buffer length
                        maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
                        maxBufferHole: 0.5,           // Maximum gap between buffered ranges
                        highBufferWatchdogPeriod: 3,
                        nudgeOffset: 0.1,             // Small nudge for seeking
                        nudgeMaxRetry: 3,
                        
                        // ABR (Adaptive Bitrate) settings
                        abrEwmaDefaultEstimate: 500000, // Default bandwidth estimate (500kbps)
                        abrEwmaSlowVoD: 5,            // Slow VoD bandwidth estimate factor
                        abrEwmaFastVoD: 3,            // Fast VoD bandwidth estimate factor
                        
                        // Fragment loading optimization
                        fragLoadingTimeOut: 20000,    // Fragment loading timeout
                        fragLoadingMaxRetry: 6,
                        fragLoadingRetryDelay: 1000,
                        fragLoadingMaxRetryTimeout: 64000,
                    });
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
                    if (theUrl) {
                        if (hlsRef.current) {
                            hlsRef.current.loadSource(theUrl);
    
                        } else {
                            video.src = theUrl; // Fallback for native support
                        }
                    }
                } else {
    
                    if(videoRef.current)videoRef.current.pause();
    
                    if (videojsRef.current ) {
    
                        if(!videoJsPlayerRef.current){
                            videoJsPlayerRef.current = videojs(videojsRef.current, {
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
                            videoJsPlayerRef.current.on('ended', onEnded);
                            videoJsPlayerRef.current.on('error', onEnded);
                        }

    
                        if (audio != null) {
                            let type = getType(audio);
                            videoJsPlayerRef.current.src({ src: theUrl, type });
                            videoJsPlayerRef.current.play();
                        }
                    }
                }
            }

        })();
  

        return () => {

           /* if (isHlsSupportFormat()) {
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
                    videoJsPlayerRef.current.off('ended', onEnded);
                    videoJsPlayerRef.current.off('error', onEnded);
                    videoJsPlayerRef.current.dispose();
                    videoJsPlayerRef.current = null;

                }
            }
*/


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
                <video ref={videoRef} controls playsInline webkit-playsinline="true" />
                <video ref={videojsRef} className="video-js vjs-default-skin" controls playsInline webkit-playsinline="true" />
                
            </div>
        </div>
    );
};

export default HLSPlayer;