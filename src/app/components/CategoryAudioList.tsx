'use client';

import { useState, useEffect } from 'react';
import { Episode, Category } from '@/types/audio';
import { useAudioPlayerStore } from '@/app/store/audioPlayerStore';
import Pagination from './Pagination';
import { PulseLoader } from 'react-spinners';

interface CategoryAudioListProps {
  categoryId: string;
  currentAudio: Episode | null;
  onAudioSelect: (audio: Episode) => void;
  isPlaying: boolean;
}

interface CategoryAudioData {
  category: Category;
  episodes: Record<string, Episode[]>;
  dates: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CategoryAudioList({
  categoryId,
  currentAudio,
  onAudioSelect,
  isPlaying
}: CategoryAudioListProps) {
  const [data, setData] = useState<CategoryAudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { setAudio, setAudioFiles: updateAudioFiles, togglePlay } = useAudioPlayerStore();

  const itemsPerPage = 20;




  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAudioSelect = (audio: Episode) => {
    if (currentAudio?.id === audio.id) {
      togglePlay();
    } else {
      setAudio(audio);
      // Flatten the grouped data for the audio player store
      const allFiles: Episode[] = [];
      if (data?.episodes) {
        Object.values(data.episodes).forEach(dateGroup => {
          dateGroup.forEach(episode => {
            allFiles.push(episode);
          });
        });
      }
      updateAudioFiles(allFiles);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <PulseLoader color="#36D7B7" loading={loading} size={16} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-2">⚠️</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={fetchCategoryAudio}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || !data.category) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Category not found</div>
      </div>
    );
  }

  const { category, episodes, dates, pagination } = data;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          {category.color && (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: category.color }}
            >
              {category.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 mt-2">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} audio file{pagination.total !== 1 ? 's' : ''} in this category
            </p>
          </div>
        </div>
      </div>

      {/* Audio Files */}
      {dates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🎵</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No episodes found</h3>
          <p className="text-gray-500">This category doesn't have any published episodes yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{new Date(date).toLocaleDateString()}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {episodes[date].map((audio) => (
                  <div
                    key={audio.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleAudioSelect(audio)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{audio.title}</h4>
                        <div className="text-sm text-gray-500">
                          <div>Format: {audio.format.toUpperCase()}</div>
                          <div>Uploaded: {new Date(audio.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAudioSelect(audio);
                          }}
                          className={`p-3 rounded-full transition-colors ${
                            currentAudio?.id === audio.id && isPlaying
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {currentAudio?.id === audio.id && isPlaying ? '⏸️' : '▶️'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
