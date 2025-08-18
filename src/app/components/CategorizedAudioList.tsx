'use client';

import { Episode, Category } from '@/types/audio';
import { useRouter } from 'next/navigation';

interface CategorizedAudioListProps {
  episodes: Episode[];
  currentAudio: Episode | null;
  onAudioSelect: (audio: Episode) => void;
  isPlaying: boolean;
}

interface GroupedAudioFiles {
  [categoryId: string]: {
    category: Category;
    episodes: Episode[];
  };
}

export default function CategorizedAudioList({
  episodes,
  currentAudio,
  onAudioSelect,
  isPlaying
}: CategorizedAudioListProps) {
  // Group episodes by category
  const groupedAudioFiles: GroupedAudioFiles = {};
  const router = useRouter();

  episodes.forEach(audio => {
    // Prefer album.category if available; fallback to audio.category
    const effectiveCategory = audio.album?.category || audio.category;
    if (effectiveCategory) {
      const categoryId = effectiveCategory.id;
      if (!groupedAudioFiles[categoryId]) {
        groupedAudioFiles[categoryId] = {
          category: effectiveCategory,
          episodes: []
        };
      }
      groupedAudioFiles[categoryId].episodes.push(audio);
    } else {
      // Handle uncategorized files
      if (!groupedAudioFiles['uncategorized']) {
        groupedAudioFiles['uncategorized'] = {
          category: { id: 'uncategorized', name: 'Uncategorized', createdAt: '', updatedAt: '' },
          episodes: []
        };
      }
      groupedAudioFiles['uncategorized'].episodes.push(audio);
    }
  });

  // Sort categories by name
  const sortedCategories = Object.values(groupedAudioFiles).sort((a, b) => {
    if (a.category.name === 'Uncategorized') return 1;
    if (b.category.name === 'Uncategorized') return -1;
    return a.category.name.localeCompare(b.category.name);
  });

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
      {sortedCategories.map(({ category, episodes }) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Category Header */}
          <div 
            className="px-6 py-4 border-b border-gray-200"
            style={{
              borderLeftColor: category.color || '#3B82F6',
              borderLeftWidth: '4px'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {episodes.length} {episodes.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>

          {/* Audio Files in this Category */}
          <div className="divide-y divide-gray-100">
            {episodes.map((audio) => (
              <div
                key={audio.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  currentAudio?.id === audio.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
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
                        <h4 className="text-sm font-medium text-gray-900 truncate"    onClick={() => router.push(`/episode/${audio.id}`)}>
                          {audio.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{audio.format.toUpperCase()}</span>
                          <span>•</span>
                          <span>{audio.duration ? `${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'}</span>
                          <span>•</span>
                          <span>{audio.status}</span>
                          {/* Prefer album.subcategory display if present */}
                          {(audio.album?.subcategory || audio.subcategory) && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {(audio.album?.subcategory || audio.subcategory)!.name}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Display Labels */}
                        {audio.labels && audio.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {audio.labels.map((label) => (
                              <span
                                key={label.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2" onClick={() => onAudioSelect(audio)}>
                    {currentAudio?.id === audio.id && isPlaying && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(audio.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
