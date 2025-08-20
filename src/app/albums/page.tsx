import { Suspense } from 'react';
import AlbumsListClient from './AlbumsListClient';

export default async function AlbumsPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hot Albums</h1>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading albums...</span>
            </div>
          }>
            <AlbumsListClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
