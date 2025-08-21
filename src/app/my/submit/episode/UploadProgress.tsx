import React from 'react';

interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  uploadProgress,
}) => {
  if (!isUploading) return null;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      ></div>
      <div className="text-xs text-gray-600 mt-1">Uploading {uploadProgress}%</div>
    </div>
  );
};