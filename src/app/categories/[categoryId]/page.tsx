'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import { AudioFile } from '@/types/audio';
import { PulseLoader } from 'react-spinners';

const CategoryAudioList = dynamic(() => import('@/app/components/CategoryAudioList'), { ssr: false });

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { setAudio, setAudioFiles: updateAudioFiles, audio, togglePlay } = useAudioPlayerStore();

  // Sync with global audio player store
  useEffect(() => {
    setCurrentAudio(audio);
    setIsPlaying(audio ? true : false);
  }, [audio]);

  const handleAudioSelect = (audio: AudioFile) => {
    if (currentAudio?.id === audio.id) {
      togglePlay();
    } else {
      setAudio(audio);
      // We'll get the audio files from the CategoryAudioList component
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        }>
          <CategoryAudioList
            categoryId={categoryId}
            currentAudio={currentAudio}
            onAudioSelect={handleAudioSelect}
            isPlaying={isPlaying}
          />
        </Suspense>
      </div>
    </div>
  );
}
