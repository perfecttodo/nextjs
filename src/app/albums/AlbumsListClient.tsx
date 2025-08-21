'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Pagination from '@/app/components/Pagination';
import type { Album } from '@/types/audio';
import { useRouter, useSearchParams } from 'next/navigation';

interface AlbumsListClientProps {
  initialPage?: number;
  pageSize?: number;
}

export default function AlbumsListClient({ initialPage = 1, pageSize = 12 }: AlbumsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '', 10);
    return Number.isFinite(p) && p > 0 ? p : initialPage;
  }, [searchParams, initialPage]);

  const [page, setPage] = useState<number>(pageFromUrl);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/albums?page=${page}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error('Failed to load albums');
        const data = await res.json();
        setAlbums(data.albums || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (e) {
        console.error(e);
        setAlbums([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbums();
  }, [page, pageSize]);

  const onPageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    router.push(`/albums?${params.toString()}`);
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading albums...</span>
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <div className="px-6 py-12 text-center bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No albums found</h3>
              <p className="text-gray-600">There are no public albums to display.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {albums.map((album) => (
                <div key={album.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: album.color || '#3B82F6' }}
                      ></div>
                      <h4 className="text-base font-semibold text-gray-900 line-clamp-1">{album.name}</h4>
                    </div>
                  </div>
                  {album.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{album.description}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    {(album._count?.episodes || 0)} episodes • {new Date(album.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/albums/${album.id}`}
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Episodes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            itemsPerPage={pageSize}
          />
        </>
      )}
    </div>
  );
}


