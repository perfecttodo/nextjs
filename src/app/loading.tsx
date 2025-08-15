'use client';

export default function AppLoading() {
  return (
    <div className="font-sans max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-xl shadow p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded w-48"></div>
        </div>
      </div>
    </div>
  );
}


