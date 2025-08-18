'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
const AudioCreationTabs = dynamic(() => import('@/app/components/AudioCreationTabs'), { ssr: false });
const UserEpisodeManagement = dynamic(() => import('@/app/my/UserEpisodeManagement'), { ssr: false });

export default function AudioManagePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Audio Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Creation Section with Tabs */}
          <div>
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse" />}>
              <AudioCreationTabs onUploadSuccess={handleRefresh} />
            </Suspense>
          </div>
          
          {/* Management Section */}
          <div>
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse" />}>
              <UserEpisodeManagement key={refreshKey} onRefresh={handleRefresh} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
