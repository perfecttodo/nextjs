'use client';

export default function LoadingAudioList() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


