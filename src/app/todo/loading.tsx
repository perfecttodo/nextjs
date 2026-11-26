'use client';

export default function LoadingItems() {
  return (
    <div className="font-sans max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}


