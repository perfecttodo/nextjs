'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AudioStatus, Label } from '@/types/audio';

// Dynamically import components to reduce initial bundle size
const AudioUpload = dynamic(() => import('./AudioUpload'), { ssr: false });
const AudioRecorder = dynamic(() => import('./AudioRecorder'), { ssr: false });
const UrlAudio = dynamic(() => import('./UrlAudio'), { ssr: false });
const FFmpegAudioRecorder = dynamic(() => import('./FFmpegAudioRecorder'), { ssr: false });

interface AudioCreationTabsProps {
  onUploadSuccess: () => void;
}

type TabType = 'upload' | 'record' | 'ffmpeg' | 'url';

export default function AudioCreationTabs({ onUploadSuccess }: AudioCreationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Shared form state that persists across tab switches
  const [sharedFormData, setSharedFormData] = useState({
    title: '',
    status: 'draft' as AudioStatus,
    language: '',
    description: '',
    originalWebsite: '',
    categoryId: '',
    subcategoryId: '',
    groupId: '',
    labels: [] as Label[]
  });

  const tabs = [
    {
      id: 'upload' as TabType,
      label: 'Upload File',
      description: 'Upload audio files from your device',
      icon: '📁',
      shortLabel: 'Upload'
    },
    {
      id: 'record' as TabType,
      label: 'Record Audio',
      description: 'Record audio directly in your browser',
      icon: '🎙️',
      shortLabel: 'Record'
    },
    {
      id: 'ffmpeg' as TabType,
      label: 'FFmpeg Recorder',
      description: 'Advanced recording with M3U8 HLS support',
      icon: '⚡',
      shortLabel: 'FFmpeg'
    },
    {
      id: 'url' as TabType,
      label: 'Audio URL',
      description: 'Submit audio from external URLs',
      icon: '🔗',
      shortLabel: 'URL'
    }
  ];

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  };

  // Update shared form data
  const updateSharedFormData = (field: keyof typeof sharedFormData, value: string | AudioStatus | Label[]) => {
    setSharedFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form data after successful upload
  const handleUploadSuccess = () => {
    setSharedFormData({
      title: '',
      status: 'draft',
      language: '',
      description: '',
      originalWebsite: '',
      categoryId: '',
      subcategoryId: '',
      groupId: '',
      labels: []
    });
    onUploadSuccess();
  };

  const renderTabContent = () => {
    const commonProps = {
      title: sharedFormData.title,
      status: sharedFormData.status,
      language: sharedFormData.language,
      description: sharedFormData.description,
      originalWebsite: sharedFormData.originalWebsite,
      selectedCategoryId: sharedFormData.categoryId,
      selectedSubcategoryId: sharedFormData.subcategoryId,
      selectedGroupId: sharedFormData.groupId,
      selectedLabels: sharedFormData.labels,
      onTitleChange: (title: string) => updateSharedFormData('title', title),
      onStatusChange: (status: AudioStatus) => updateSharedFormData('status', status),
      onLanguageChange: (language: string) => updateSharedFormData('language', language),
      onDescriptionChange: (description: string) => updateSharedFormData('description', description),
      onOriginalWebsiteChange: (originalWebsite: string) => updateSharedFormData('originalWebsite', originalWebsite),
      onCategoryChange: (categoryId: string) => updateSharedFormData('categoryId', categoryId),
      onSubcategoryChange: (subcategoryId: string) => updateSharedFormData('subcategoryId', subcategoryId),
      onGroupChange: (groupId: string) => updateSharedFormData('groupId', groupId),
      onLabelsChange: (labels: Label[]) => updateSharedFormData('labels', labels),
      onUploadSuccess: handleUploadSuccess,
      ownerId: 'user-id' // This should come from user context
    };

    switch (activeTab) {
      case 'upload':
        return <AudioUpload {...commonProps} />;
      case 'record':
        return <AudioRecorder {...commonProps} onUploaded={handleUploadSuccess} />;
      case 'ffmpeg':
        return <FFmpegAudioRecorder {...commonProps} onUploaded={handleUploadSuccess} />;
      case 'url':
        return <UrlAudio {...commonProps} />;
      default:
        return <AudioUpload {...commonProps} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 px-4 sm:px-6" aria-label="Audio creation tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 sm:flex-none py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-lg sm:text-xl">{tab.icon}</span>
                <div className="text-center sm:text-left">
                  <div className="font-medium text-xs sm:text-sm">
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                  {(activeTab === tab.id&&<div className="text-xs text-gray-400 hidden lg:block">
                    {tab.description}
                  </div>)}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content with Animation */}
      <div className="p-4 sm:p-6">
        <div
          className={`transition-opacity duration-200 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Active Tab Indicator */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{tabs.find(t => t.id === activeTab)?.icon}</span>
              <div>
                <div className="font-medium text-blue-900">
                  {tabs.find(t => t.id === activeTab)?.label}
                </div>
                <div className="text-sm text-blue-700">
                  {tabs.find(t => t.id === activeTab)?.description}
                </div>
              </div>
            </div>
          </div>

          {/* Form Data Persistence Info */}
          {(sharedFormData.title || sharedFormData.language || sharedFormData.description || sharedFormData.originalWebsite || sharedFormData.categoryId) && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-md">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">💾</span>
                <div className="text-sm text-green-800">
                  <div className="font-medium">Form data is saved</div>
                  <div className="text-xs text-green-600">
                    Your input will be preserved when switching between tabs
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
