'use client';

export default function LoadingAudioDetail() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}


