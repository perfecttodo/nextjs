'use client';

import { useState, useEffect } from 'react';
import { Group } from '@/types/audio';

interface GroupSelectorProps {
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  className?: string;
}

export default function GroupSelector({ selectedGroupId, onGroupChange, className = '' }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/audio/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Group
        </label>
        <div className="text-sm text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Group
        </label>
        <div className="text-sm text-red-500">Error: {error}</div>
        <button
          onClick={fetchGroups}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
        Group (Optional)
      </label>
      <select
        id="group"
        value={selectedGroupId}
        onChange={(e) => onGroupChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">No Group</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
            {group.description && ` - ${group.description}`}
          </option>
        ))}
      </select>
      {groups.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          No groups created yet. Create groups to organize your audio files.
        </p>
      )}
    </div>
  );
}

