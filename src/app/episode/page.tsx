import { Suspense } from 'react';
import { Episode } from '@/types/audio';
import { PulseLoader } from 'react-spinners';
import EpisodeList from './EpisodeList'; // Import the client component

async function fetchAudioFiles() {
  const response = await fetch('https://tayino.com/api/episode/published'); // Use absolute URL
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
  
  return allFiles;
}

export default async function AudioPlayerPage() {
  let episodes: Episode[] = [];
  let error: string | null = null;

  try {
    episodes = await fetchAudioFiles();
  } catch (err: any) {
    console.error('Error fetching episodes:', err);
    error = 'Failed to load episodes. Please try again later.';
  }

  return (
    <div className="p-6 pb-32">
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
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className="grid grid-cols-1">
            {/* Album Section */}
            <div className="lg:col-span-2">
              {!episodes.length ? (
                <div className="flex justify-center items-center h-48">
                  <PulseLoader color="#36D7B7" loading={true} size={16} />
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
                  <EpisodeList episodes={episodes} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}