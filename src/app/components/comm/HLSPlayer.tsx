// HLSPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import { Episode } from '@/types/audio';

import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
interface HLSPlayerProps {

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
        currentIndex, setStatus,isToggle
    } = useAudioPlayerStore();

    const onEnded = () => {
        console.log('onEnd')
    }
    const onPlay = () => {
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
    useEffect(() => {

        setUrl(audio?.blobUrl);

    }, [audio]);


    useEffect(()=>{
        const video = videoRef.current;
        if(video){
            if(isHlsSupportFormat()){
                if(video.paused){
                    video.play();
                }else{
                    video.pause();
                }
               

            }else if(videoJsPlayerRef.current){
                if(videoJsPlayerRef.current.paused()){
                    videoJsPlayerRef.current.play();
                    play();

                }else{
                    videoJsPlayerRef.current.pause();
                    pause();

                }
                    
            }
        }



    },[isToggle]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        setStatus('');
        if (isHlsSupportFormat()) {
            if (Hls.isSupported() && !hlsRef.current) {
                hlsRef.current = new Hls();
                hlsRef.current.attachMedia(video);
                hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play();
                });

                hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        onError(`HLS Error: ${data.fatal}`);
                    }
                });

                video.addEventListener('ended', onEnded);
                video.addEventListener('pause', onPause);
                video.addEventListener('play', onPlay);
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
                    autoplay: false,
                    preload: 'metadata',
                    fluid: true,
                    responsive: true,
                    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                    controlBar: {
                        children: []
                    }
                });

                videoJsPlayerRef.current.on('loadedmetadata', onPlay);
                if (audio != null) {
                    let type = getType(audio);
                    videoJsPlayerRef.current.src({
                        src: url,
                        type
                    });
                    videoJsPlayerRef.current.play();
                }
            }
        }


        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (videoJsPlayerRef.current) {
                videoJsPlayerRef.current.dispose();
                videoJsPlayerRef.current = null;
            }
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('pause', onPause);
        };
    }, [url]);

    return (
        <video ref={videoRef} className="video-js vjs-default-skin" controls playsInline webkit-playsinline="true" />
    );
};

export default HLSPlayer;