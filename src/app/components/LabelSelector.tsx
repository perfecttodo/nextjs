'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/types/audio';

interface LabelSelectorProps {
  selectedLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  ownerId?: string;
}

export default function LabelSelector({
  selectedLabels,
  onLabelsChange,
  ownerId
}: LabelSelectorProps) {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Label[]>([]);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const params = new URLSearchParams();
        if (ownerId) params.append('ownerId', ownerId);
        
        const response = await fetch(`/api/audio/labels?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableLabels(data.labels);
        }
      } catch (error) {
        console.error('Error fetching labels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [ownerId]);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableLabels.filter(label => 
        label.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedLabels.some(selected => selected.id === label.id)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, availableLabels, selectedLabels]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addCustomLabel(inputValue.trim());
    }
  };

  const addCustomLabel = (labelName: string) => {
    // Check if label already exists
    const existingLabel = availableLabels.find(label => 
      label.name.toLowerCase() === labelName.toLowerCase()
    );

    if (existingLabel) {
      // Add existing label if not already selected
      if (!selectedLabels.some(selected => selected.id === existingLabel.id)) {
        onLabelsChange([...selectedLabels, existingLabel]);
      }
    } else {
      // Create new label object (will be saved when audio is uploaded)
      const newLabel: Label = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: labelName,
        color: '#3B82F6', // Default blue color
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onLabelsChange([...selectedLabels, newLabel]);
    }
    
    setInputValue('');
    setSuggestions([]);
  };

  const removeLabel = (labelId: string) => {
    onLabelsChange(selectedLabels.filter(label => label.id !== labelId));
  };

  const selectSuggestion = (label: Label) => {
    if (!selectedLabels.some(selected => selected.id === label.id)) {
      onLabelsChange([...selectedLabels, label]);
    }
    setInputValue('');
    setSuggestions([]);
  };

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      {/* Label Input */}
      <div>
        <label htmlFor="labels" className="block text-sm font-medium text-gray-700 mb-2">
          Labels
        </label>
        <div className="relative">
          <input
            type="text"
            id="labels"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Type label names and press Enter (e.g., work, personal, music)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => selectSuggestion(label)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {label.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to add a label, or select from suggestions
        </p>
      </div>

      {/* Selected Labels Display */}
      {selectedLabels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Labels ({selectedLabels.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                {label.name}
                <button
                  type="button"
                  onClick={() => removeLabel(label.id)}
                  className="ml-2 text-current hover:opacity-70"
                  title="Remove label"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
