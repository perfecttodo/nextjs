'use client';

import { Episode } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import { useEffect } from 'react';

interface PlayButtonProps {
  episode: Episode;
  episodes: Episode[] | null;
}
export default function PlayButton({ episode, episodes }: PlayButtonProps) {
  const { setAudio, setAudioFiles: updateAudioFiles, audio: currentAudio, togglePlay, isPlaying,status } = useAudioPlayerStore();
  const onPlayAudio = (audio: Episode) => {
    if (currentAudio?.id === audio.id) {
      togglePlay();
    } else {
      if (episodes) updateAudioFiles(episodes);
        setAudio(audio);

    }
  };

  useEffect(()=>{
    console.log(isPlaying)
  },[isPlaying])

  return (
      <div className={`inline ${currentAudio?.id === episode.id&&status==''?"spinner":''}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayAudio(episode);
        }}
        className={`rounded-full transition-colors  ${currentAudio?.id === episode.id
            ? ' text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        title={currentAudio?.id === episode.id ? 'Currently Playing' : 'Play Audio'}
      >
        {currentAudio?.id === episode.id && isPlaying ? '⏸️' : '▶️'}
      </button>
      </div>
  );
}
