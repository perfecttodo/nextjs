'use client';

import { Episode } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';

interface PlayButtonProps {
  episode: Episode;
  episodes: Episode[] | null;
}
export default function PlayButton({ episode, episodes }: PlayButtonProps) {
  const { setAudio, setAudioFiles: updateAudioFiles, audio: currentAudio, togglePlay, isPlaying } = useAudioPlayerStore();
  const onPlayAudio = (audio: Episode) => {
    if (currentAudio?.id === audio.id) {
      togglePlay();
    } else {
      setAudio(audio);
      if (episodes) updateAudioFiles(episodes);
    }
  };

  return (
    <>
      {/* Play Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayAudio(episode);
        }}
        className={`p-2 rounded-full transition-colors ${currentAudio?.id === episode.id
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        title={currentAudio?.id === episode.id ? 'Currently Playing' : 'Play Audio'}
      >
        {currentAudio?.id === episode.id && isPlaying ? '⏸️' : '▶️'}
      </button></>
  );
}
