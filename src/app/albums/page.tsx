import { Suspense } from 'react';
import AlbumsListClient from './AlbumsListClient';

// Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

async function getAlbumsData(page: number = 1, pageSize: number = 12) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/albums?page=${page}&pageSize=${pageSize}`, {
    next: { revalidate: 86400 }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch albums');
  }
  
  return res.json();
}

export default async function AlbumsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 12;
  
  // Fetch data on the server with revalidation
  const data = await getAlbumsData(page, pageSize);

  return (
    <div className="">
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
            <AlbumsListClient 
              initialAlbums={data.albums || []}
              initialTotal={data.total || 0}
              initialTotalPages={data.totalPages || 1}
              initialPage={page}
              pageSize={pageSize}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}