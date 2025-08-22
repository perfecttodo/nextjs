'use client';

import { Episode } from '@/types/audio';
import { useRouter } from 'next/navigation';
import PlayButton from '@/app/components/PlayButton';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';

interface CategorizedAudioListProps {
  episodes: Episode[];
}


export default function CategorizedAudioList({
  episodes
}: CategorizedAudioListProps) {
  const router = useRouter();

  const {  audio: currentAudio } = useAudioPlayerStore();



  if (episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No episodes found</div>
        <div className="text-gray-400 text-sm mt-2">Upload some episodes to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Episodes in this Category */}
      <div className="divide-y divide-gray-100">
        {episodes.map((audio) => (
          <div
            key={audio.id}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${currentAudio?.id === audio.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}

          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🎵</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate mb-2 cursor-pointer " onClick={() => router.push(`/episode/${audio.id}`)}>
                      {audio.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className='truncate'>{audio.format.toUpperCase()}</span>
                      <span>•</span>
                      <span>{audio.duration ? `${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'}</span>
                      <span>•</span>
                      <span>{audio.status}</span>
                      {audio?.album?.id && ( <>lbum:<a  onClick={() => router.push(`/albums/${audio?.album?.id}`)} ><span className='font-bold cursor-pointer '>{audio?.album?.name}</span></a></>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2" >

                <div className="text-xs text-gray-400">
                  {new Date(audio.createdAt).toLocaleDateString()}
                </div>
                <PlayButton episode={audio} episodes={episodes} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
