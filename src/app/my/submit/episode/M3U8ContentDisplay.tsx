import React from 'react';

interface M3U8ContentDisplayProps {
  showM3U8Content: boolean;
  m3u8Content: string;
  m3u8ContentLoading: boolean;
  onToggle: () => void;
  getM3U8Content: () => Promise<string>;
}

export const M3U8ContentDisplay: React.FC<M3U8ContentDisplayProps> = ({
  showM3U8Content,
  m3u8Content,
  m3u8ContentLoading,
  onToggle,
  getM3U8Content,
}) => {
  const handleClick = async () => {
    if (!showM3U8Content) {
      await getM3U8Content();
    }
    onToggle();
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
        disabled={m3u8ContentLoading}
      >
        {m3u8ContentLoading ? 'Loading...' : (showM3U8Content ? 'Hide' : 'Show')} M3U8 Content
      </button>

      {showM3U8Content && (
        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
          <div className="text-gray-600 mb-2">M3U8 Playlist Content:</div>
          <pre className="whitespace-pre-wrap break-words">
            {m3U8Content}
          </pre>
        </div>
      )}
    </div>
  );
};