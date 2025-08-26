import Link from 'next/link';
import { Episode } from '@/types/audio';
import EpisodeList from './EpisodeList'; // Import the client component

async function fetchAudioFiles() {
  const allFiles: Episode[] = [];
  const apiUrl = process.env.NEXT_PUBLISH_EPISODES_API_URL; // Access the environment variable
  if (!apiUrl) {
    return allFiles;
  }
  const response = await fetch(apiUrl); // Use the API URL from the environment variable
  if (!response.ok) {
    return allFiles;
  }
  const data = await response.json();

  // Flatten the grouped data into a single array
  Object.values(data.episodes).forEach((dateGroup: any) => {
    dateGroup.forEach((audio: any) => {
      allFiles.push(audio);
    });
  });

  return allFiles;
}

export default async function AudioPlayerPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page as string) || 1;
  const itemsPerPage = 10;

  let episodes: Episode[] = [];
  let error: string | null = null;

  try {
    episodes = await fetchAudioFiles();
  } catch (err: any) {
    console.error('Error fetching episodes:', err);
    error = 'Failed to load episodes. Please try again later.';
  }

  const totalEpisodes = episodes.length;
  const totalPages = Math.ceil(totalEpisodes / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentEpisodes = episodes.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="lg:col-span-2">
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <EpisodeList episodes={currentEpisodes} />
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <Link href={`?page=${page - 1}`} passHref>
            <button className={`px-4 py-2 bg-gray-300 rounded ${page === 1 ? 'disabled:opacity-50' : ''}`} disabled={page === 1}>Previous</button>
          </Link>
          <span>Page {page} of {totalPages}</span>
          <Link href={`?page=${page + 1}`} passHref>
            <button className={`px-4 py-2 bg-gray-300 rounded ${page === totalPages ? 'disabled:opacity-50' : ''}`} disabled={page === totalPages}>Next</button>
          </Link>
        </div>
      </div>
    </div>
  );
}