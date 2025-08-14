'use client';

import { useState, useEffect } from 'react';
import AudioList from '@/app/components/AudioList';
import { AudioFile } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
export default function AudioPlayerPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);

  const { setAudio,setAudioFiles:updateAudioFiles,audio} = useAudioPlayerStore();
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
    setAudio(audio)
    updateAudioFiles(audioFiles);

  };


  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1">
          {/* Audio Section */}

          
          {/* Audio List Section */}
          <div className="lg:col-span-2">
            <AudioList
              audioFiles={audioFiles}
              currentAudio={audio}
              onAudioSelect={handleAudioSelect}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
