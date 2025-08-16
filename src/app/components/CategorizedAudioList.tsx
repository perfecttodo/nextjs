'use client';

import { AudioFile, Category } from '@/types/audio';

interface CategorizedAudioListProps {
  audioFiles: AudioFile[];
  currentAudio: AudioFile | null;
  onAudioSelect: (audio: AudioFile) => void;
  isPlaying: boolean;
}

interface GroupedAudioFiles {
  [categoryId: string]: {
    category: Category;
    audioFiles: AudioFile[];
  };
}

export default function CategorizedAudioList({
  audioFiles,
  currentAudio,
  onAudioSelect,
  isPlaying
}: CategorizedAudioListProps) {
  // Group audio files by category
  const groupedAudioFiles: GroupedAudioFiles = {};
  
  audioFiles.forEach(audio => {
    if (audio.category) {
      const categoryId = audio.category.id;
      if (!groupedAudioFiles[categoryId]) {
        groupedAudioFiles[categoryId] = {
          category: audio.category,
          audioFiles: []
        };
      }
      groupedAudioFiles[categoryId].audioFiles.push(audio);
    } else {
      // Handle uncategorized files
      if (!groupedAudioFiles['uncategorized']) {
        groupedAudioFiles['uncategorized'] = {
          category: { id: 'uncategorized', name: 'Uncategorized', createdAt: '', updatedAt: '' },
          audioFiles: []
        };
      }
      groupedAudioFiles['uncategorized'].audioFiles.push(audio);
    }
  });

  // Sort categories by name
  const sortedCategories = Object.values(groupedAudioFiles).sort((a, b) => {
    if (a.category.name === 'Uncategorized') return 1;
    if (b.category.name === 'Uncategorized') return -1;
    return a.category.name.localeCompare(b.category.name);
  });

  if (audioFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No audio files found</div>
        <div className="text-gray-400 text-sm mt-2">Upload some audio files to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedCategories.map(({ category, audioFiles }) => (
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
                  {audioFiles.length} {audioFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>

          {/* Audio Files in this Category */}
          <div className="divide-y divide-gray-100">
            {audioFiles.map((audio) => (
              <div
                key={audio.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  currentAudio?.id === audio.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => onAudioSelect(audio)}
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
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {audio.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{audio.format.toUpperCase()}</span>
                          <span>•</span>
                          <span>{audio.duration ? `${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'}</span>
                          <span>•</span>
                          <span>{audio.status}</span>
                          {audio.subcategory && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {audio.subcategory.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
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
