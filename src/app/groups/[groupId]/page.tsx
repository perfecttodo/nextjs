'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Group, AudioFile } from '@/types/audio';
import Pagination from '@/app/components/Pagination';
import Link from 'next/link';

interface GroupDetailData {
  group: Group;
  audioFiles: AudioFile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalAudioFiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, currentPage, searchQuery, statusFilter]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/audio/groups/${groupId}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group data');
      }
      
      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Group not found'}</p>
          <Link href="/groups" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const { group, audioFiles, pagination } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link href="/groups" className="text-blue-600 hover:text-blue-800 underline">
              ← Back to Groups
            </Link>
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: group.color || '#3B82F6' }}
            />
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          </div>
        </div>
        
        {group.description && (
          <p className="text-gray-600 text-lg">{group.description}</p>
        )}
        
        <div className="mt-2 text-sm text-gray-500">
          Created {new Date(group.createdAt).toLocaleDateString()} • 
          {pagination.totalAudioFiles} audio file(s)
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio files by title or description..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Audio Files List */}
      <div className="space-y-4">
        {audioFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No audio files found in this group.</p>
            {searchQuery || statusFilter !== 'all' ? (
              <p className="text-sm mt-2">Try adjusting your search criteria.</p>
            ) : (
              <p className="text-sm mt-2">Start adding audio files to this group.</p>
            )}
          </div>
        ) : (
          audioFiles.map((audio) => (
            <div
              key={audio.id}
              className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{audio.title}</h3>
                  {audio.description && (
                    <p className="text-sm text-gray-600 mt-1">{audio.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Format: {audio.format.toUpperCase()}</span>
                    {audio.duration && <span>Duration: {formatDuration(audio.duration)}</span>}
                    <span>Size: {formatFileSize(audio.fileSize)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      audio.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {audio.status}
                    </span>
                  </div>
                  
                  {audio.category && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Category:</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {audio.category.name}
                      </span>
                      {audio.subcategory && (
                        <>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {audio.subcategory.name}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {audio.labels && audio.labels.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Labels:</span>
                      {audio.labels.map((label) => (
                        <span
                          key={label.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: label.color ? `${label.color}20` : '#f3f4f6',
                            color: label.color || '#374151'
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-right text-xs text-gray-500">
                  <div>{new Date(audio.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.totalAudioFiles}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}

