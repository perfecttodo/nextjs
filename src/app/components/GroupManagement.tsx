'use client';

import { useState, useEffect } from 'react';
import { Group } from '@/types/audio';

export default function GroupManagement() {
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Audio Groups</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Create Group
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No groups created yet.</p>
            <p className="text-sm mt-2">Create your first group to start organizing your audio files.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="p-4 bg-white rounded-lg border shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: group.color || '#3B82F6' }}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {group.audioFiles?.length || 0} audio file(s)
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
