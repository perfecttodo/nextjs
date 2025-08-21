'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@/app/hooks/useUser';
const AudioCreationTabs = dynamic(() => import('@/app/components/upload/AudioCreationTabs'), { ssr: false });
const UserEpisodeManagement = dynamic(() => import('@/app/my/UserEpisodeManagement'), { ssr: false });

export default function AudioManagePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { user, loading: userLoading } = useUser();
  if(userLoading)return (<div>Loading</div>);

  if (!user) {
    return (
      <div className=" flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view this album.</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" p-6">
      <div className="max-w-6xl mx-auto">
        
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
