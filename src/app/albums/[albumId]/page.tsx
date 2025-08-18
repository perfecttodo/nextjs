import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AlbumAudioClient from './AlbumAudioClient';

// Use inferred Prisma payload types instead of manual shape

export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const resolved = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view this album.</p>
        </div>
      </div>
    );
  }

  // Fetch album details
  const album = await prisma.album.findFirst({
    where: {
      id: resolved.albumId,
      ownerId: user.sub,
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
          categoryId: true,
        },
      },
      audioFiles: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          audioFiles: true,
        },
      },
    },
  });

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  {album.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {album.category.name}
                    </span>
                  )}
                  {album.group && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {album.group.name}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {album._count.audioFiles} audio files
                  </span>
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
              <span className="ml-2 text-gray-600">Loading audio files...</span>
            </div>
          }>
            <AlbumAudioClient 
              album={album as any} 
              audioFiles={album.audioFiles as any}
              userId={user.sub}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
