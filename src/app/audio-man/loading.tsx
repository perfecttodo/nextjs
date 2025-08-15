'use client';

export default function LoadingAudioManage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse h-40" />
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6 animate-pulse h-96" />
        </div>
      </div>
    </div>
  );
}


