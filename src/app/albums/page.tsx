import { Suspense } from 'react';
import AlbumManagementClient from './AlbumManagementClient';
import { getSessionUser } from '@/lib/session';

export default async function AlbumsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to manage your albums.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Album Management</h1>
            <p className="mt-2 text-gray-600">
              Organize your episodes into albums and collections
            </p>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading albums...</span>
            </div>
          }>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
