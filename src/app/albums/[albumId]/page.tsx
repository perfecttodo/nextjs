import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AlbumAudioClient from './AlbumAudioClient';

export const revalidate = 86400; // 24 hours in seconds

interface PageProps {
  params: Promise<{ albumId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Fetch album details with paginated episodes
  const album = await prisma.album.findFirst({
    where: {
      id: resolvedParams.albumId
    },
    include: {
      episodes: {
        where: {
          status: 'published' 
        },
        select: {
          id: true,
          title: true,
          originalName: true,
          format: true,
          duration: true,
          fileSize: true,
          status: true,
          language: true,
          description: true,
          originalWebsite: true,
          createdAt: true,
          blobUrl: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: itemsPerPage,
      },
      _count: {
        select: {
          episodes: {
            where: {
              status: 'published' 
            }
          },
        },
      },
    },
  });

  if (!album) {
    notFound();
  }

  const totalEpisodes = album._count.episodes;
  const totalPages = Math.ceil(totalEpisodes / itemsPerPage);

  return (
    <div className="">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Album Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div 
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: album.color || '#3B82F6' }}
              ></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{album.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {totalEpisodes} episodes
                  </span>
                  {totalPages > 1 && (
                    <span className="text-sm text-gray-400">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {album.description && (
              <p className="text-gray-600 max-w-3xl">{album.description}</p>
            )}
            
            <div className="mt-4 text-sm text-gray-500">
              Created {new Date(album.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading episodes...</span>
            </div>
          }>
            <AlbumAudioClient 
              album={album as any} 
              episodes={album.episodes as any}
              userId={null}
              currentPage={currentPage}
              totalPages={totalPages}
              totalEpisodes={totalEpisodes}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}