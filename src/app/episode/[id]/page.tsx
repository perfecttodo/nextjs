import { Suspense } from 'react';
import AudioDetailClient from './AudioDetailClient';

export default async function AudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const audioId = resolvedParams.id;

  return (
    <Suspense fallback={
      <div className=" p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading audio details...</p>
          </div>
        </div>
      </div>
    }>
      <AudioDetailClient audioId={audioId} />
    </Suspense>
  );
}

