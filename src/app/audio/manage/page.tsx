'use client';

import { useState } from 'react';
import AudioUpload from '../../components/AudioUpload';
import AudioManagement from '../../components/AudioManagement';
import AudioRecorder from '../../components/AudioRecorder';
import UrlAudio from '../../components/UrlAudio';

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
            <AudioRecorder onUploaded={handleRefresh} />
            <AudioUpload onUploadSuccess={handleRefresh} />
            <UrlAudio onUploadSuccess={handleRefresh}/>

          </div>
          
          {/* Management Section */}
          <div>
            <AudioManagement key={refreshKey} onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
    </div>
  );
}
