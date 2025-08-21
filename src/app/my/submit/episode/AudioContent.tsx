import React from 'react';
import UploadProvider from '../../../components/upload/UploadProvider';
import RecordingProvider from '../../../components/upload/RecordingProvider';
import UrlProvider from '../../../components/upload/UrlProvider';

interface AudioContentProps {
  activeTab: string;
  onSuccess: (blob: Blob | string | null) => void;
}

const AudioContent: React.FC<AudioContentProps> = ({ activeTab, onSuccess }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadProvider onSuccess={onSuccess} />;
      case 'record':
        return <RecordingProvider onSuccess={onSuccess} />;
      case 'url':
        return <UrlProvider onSuccess={onSuccess} />;
      default:
        return <UploadProvider onSuccess={onSuccess} />;
    }
  };

  return <div>{renderTabContent()}</div>;
};

export default AudioContent;