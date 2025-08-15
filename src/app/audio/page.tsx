'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const AudioList = dynamic(() => import('@/app/components/AudioList'), { ssr: false });
import { AudioFile } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
export default function AudioPlayerPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { setAudio,setAudioFiles:updateAudioFiles,audio:currentAudio,togglePlay,isPlaying} = useAudioPlayerStore();

  // Fetch published audio files from API
  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const response = await fetch('/api/audio/published');
        if (response.ok) {
          const data = await response.json();
          // Flatten the grouped data into a single array
          const allFiles: AudioFile[] = [];
          Object.values(data.audioFiles).forEach((dateGroup: any) => {
            dateGroup.forEach((audio: any) => {
              allFiles.push(audio);
            });
          });
          setAudioFiles(allFiles);
        }
      } catch (error) {
        console.error('Error fetching audio files:', error);
      }
    };

    fetchAudioFiles();
  }, []);

  const handleAudioSelect = (audio: AudioFile) => {
    if(currentAudio?.id===audio.id){
      togglePlay();
    }else{
      setAudio(audio)
      updateAudioFiles(audioFiles);
    }


  };


  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1">
          {/* Audio Section */}

          
          {/* Audio List Section */}
          <div className="lg:col-span-2">
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
              <AudioList
                audioFiles={audioFiles}
                currentAudio={currentAudio}
                onAudioSelect={handleAudioSelect}
                isPlaying={isPlaying}
              />
            </Suspense>
          </div>
        </div>

      </div>
    </div>
  );
}
