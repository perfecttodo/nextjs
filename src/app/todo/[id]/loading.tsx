'use client';

export default function LoadingItemEdit() {
  return (
    <div className="font-sans max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-100 rounded"></div>
        <div className="h-24 bg-gray-100 rounded"></div>
        <div className="h-10 bg-gray-100 rounded w-32"></div>
      </div>
    </div>
  );
}


