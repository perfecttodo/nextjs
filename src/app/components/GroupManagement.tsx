'use client';

import { useState, useEffect } from 'react';
import { Group } from '@/types/audio';
import Pagination from './Pagination';
import Link from 'next/link';

export default function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/episode/groups?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      setGroups(data.groups || []);
      setTotalPages(data.pagination.totalPages);
      setTotalGroups(data.pagination.totalGroups);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const url = editingGroup 
        ? `/api/episode/groups/${editingGroup.id}`
        : '/api/episode/groups';
      
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingGroup ? 'update' : 'create'} group`);
      }

      const data = await response.json();
      
      if (editingGroup) {
        setGroups(groups.map(g => g.id === editingGroup.id ? data.group : g));
      } else {
        setGroups([data.group, ...groups]);
      }
      
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingGroup ? 'update' : 'create'} group`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowForm(false);
    setEditingGroup(null);
    setError('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGroups(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    fetchGroups(page, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6'
    });
    setShowForm(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Audio files will be removed from the group but not deleted.')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/episode/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }

      setGroups(groups.filter(g => g.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
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
        <button 
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Group
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Search Form */}
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search groups by name or description..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchGroups(1, '');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Group Creation Form */}
      {showForm && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingGroup ? 'Edit Group' : 'Create New Group'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter group name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter group description (optional)"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (editingGroup ? 'Updating...' : 'Creating...') : (editingGroup ? 'Update Group' : 'Create Group')}
              </button>
            </div>
          </form>
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
              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <Link 
                      href={`/groups/${group.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                    </Link>
                    {group.description && (
                      <p className="text-sm text-gray-600">{group.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {group._count?.episodes || 0} audio file(s)
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalGroups}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
