'use client';

import { useState, useEffect, useRef } from 'react';
import FixedAudioPlayer from '@/app/components/FixedAudioPlayer';
import AudioList from '@/app/components/AudioList';
import { AudioFile } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
export default function AudioPlayerPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const [playMode, setPlayMode] = useState<'sequence' | 'loop' | 'random'>('sequence');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { setAudio} = useAudioPlayerStore();

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
              allFiles.push({
                id: audio.id,
                title: audio.title,
                originalName: audio.originalName,
                blobUrl: audio.blobUrl,
                blobId: audio.blobId,
                format: audio.format,
                duration: audio.duration,
                fileSize: audio.fileSize,
                status: audio.status,
                ownerId: audio.ownerId,
                createdAt: new Date(audio.createdAt),
                updatedAt: new Date(audio.updatedAt)
              });
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
    setCurrentAudio(audio);
    setAudio(audio)
    setCurrentIndex(audioFiles.findIndex(file => file.id === audio.id));
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (audioFiles.length === 0) return;
    
    let nextIndex: number;
    
    switch (playMode) {
      case 'sequence':
        nextIndex = (currentIndex + 1) % audioFiles.length;
        break;
      case 'loop':
        nextIndex = currentIndex; // Stay on same track
        break;
      case 'random':
        nextIndex = Math.floor(Math.random() * audioFiles.length);
        break;
      default:
        nextIndex = (currentIndex + 1) % audioFiles.length;
    }
    
    setCurrentIndex(nextIndex);
    setCurrentAudio(audioFiles[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (audioFiles.length === 0) return;
    
    let prevIndex: number;
    
    switch (playMode) {
      case 'sequence':
        prevIndex = currentIndex === 0 ? audioFiles.length - 1 : currentIndex - 1;
        break;
      case 'loop':
        prevIndex = currentIndex; // Stay on same track
        break;
      case 'random':
        prevIndex = Math.floor(Math.random() * audioFiles.length);
        break;
      default:
        prevIndex = currentIndex === 0 ? audioFiles.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    setCurrentAudio(audioFiles[prevIndex]);
    setIsPlaying(true);
  };

  const handlePlayModeChange = (mode: 'sequence' | 'loop' | 'random') => {
    setPlayMode(mode);
  };

  const handleAudioEnded = () => {
    if (playMode === 'sequence') {
      handleNext();
    } else if (playMode === 'loop') {
      // Restart current audio
      setIsPlaying(true);
    } else if (playMode === 'random') {
      handleNext();
    }
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
              currentAudio={currentAudio}
              onAudioSelect={handleAudioSelect}
              currentIndex={currentIndex}
            />
          </div>
        </div>
       {false&& (<FixedAudioPlayer
              audio={currentAudio}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onEnded={handleAudioEnded}
              playMode={playMode}
              onPlayModeChange={handlePlayModeChange}
              onAudioSelect={handleAudioSelect}
              audioFiles={audioFiles}
              currentIndex={currentIndex}
            />)}
      </div>
    </div>
  );
}
