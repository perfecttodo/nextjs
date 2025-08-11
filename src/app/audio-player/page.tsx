'use client';

import { useState, useEffect, useRef } from 'react';
import AudioPlayer from '../components/AudioPlayer';
import AudioList from '../components/AudioList';
import { AudioFile } from '../../types/audio';

export default function AudioPlayerPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const [playMode, setPlayMode] = useState<'sequence' | 'loop' | 'random'>('sequence');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
                url: audio.blobUrl,
                duration: audio.duration || 0,
                uploadDate: new Date(audio.createdAt),
                format: audio.format
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Audio Player</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Audio Player Section */}
          <div className="lg:col-span-1">
            <AudioPlayer
              audio={currentAudio}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onEnded={handleAudioEnded}
              playMode={playMode}
              onPlayModeChange={handlePlayModeChange}
            />
          </div>
          
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
      </div>
    </div>
  );
}
