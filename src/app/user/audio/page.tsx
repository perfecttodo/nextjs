'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
const AudioUpload = dynamic(() => import('@/app/components/AudioUpload'), { ssr: false });
const AudioManagement = dynamic(() => import('@/app/components/AudioManagement'), { ssr: false });
const AudioRecorder = dynamic(() => import('@/app/components/AudioRecorder'), { ssr: false });
const UrlAudio = dynamic(() => import('@/app/components/UrlAudio'), { ssr: false });

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
          {/* Recorder + Upload Section */}
          <div className="space-y-6">
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-40 animate-pulse" />}>
              <AudioRecorder onUploaded={handleRefresh} />
            </Suspense>
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-40 animate-pulse" />}>
              <AudioUpload onUploadSuccess={handleRefresh} />
            </Suspense>
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-40 animate-pulse" />}>
              <UrlAudio onUploadSuccess={handleRefresh}/>
            </Suspense>

          </div>
          
          {/* Management Section */}
          <div>
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse" />}>
              <AudioManagement key={refreshKey} onRefresh={handleRefresh} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
