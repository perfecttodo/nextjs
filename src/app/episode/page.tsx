'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const CategorizedAudioList = dynamic(() => import('@/app/components/CategorizedAudioList'), { ssr: false });
import { Episode } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import { PulseLoader } from 'react-spinners';

export default function AudioPlayerPage() {
  const [episodes, setAudioFiles] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const { setAudio,setAudioFiles:updateAudioFiles,audio:currentAudio,togglePlay,isPlaying} = useAudioPlayerStore();
  const [error, setError] = useState<string | null>(null);

  // Fetch published episodes from API
  useEffect(() => {
    const fetchAudioFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/episode/published');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Flatten the grouped data into a single array
        const allFiles: Episode[] = [];
        Object.values(data.episodes).forEach((dateGroup: any) => {
          dateGroup.forEach((audio: any) => {
            allFiles.push(audio);
          });
        });
        setAudioFiles(allFiles);
        setError(null);
      } catch (error:any) {
        console.error('Error fetching episodes:', error);
        setError('Failed to load episodes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudioFiles();
  }, []);

  const handleAudioSelect = (audio: Episode) => {
    if(currentAudio?.id===audio.id){
      togglePlay();
    }else{
      setAudio(audio)
      updateAudioFiles(episodes);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Episodes</h1>
              <p className="text-gray-600">Browse and listen to all published episodes</p>
            </div>

          </div>
        </div>
        
        <div className="grid grid-cols-1">
          {/* Audio Section */}

          
          {/* Album Section */}
          <div className="lg:col-span-2">
          {loading ? (
              <div className="flex justify-center items-center h-48">
                <PulseLoader color="#36D7B7" loading={loading} size={16} />
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
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
              <CategorizedAudioList
                episodes={episodes}
                currentAudio={currentAudio}
                onAudioSelect={handleAudioSelect}
                isPlaying={isPlaying}
              />
            </Suspense>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}