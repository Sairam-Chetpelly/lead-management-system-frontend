'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Keyword {
  _id: string;
  name: string;
}

interface SearchableKeywordDropdownProps {
  keywords: Keyword[];
  selectedKeywords: string[];
  onChange: (keywords: string[]) => void;
  onCreateKeyword?: (name: string) => Promise<void>;
  placeholder?: string;
}

export default function SearchableKeywordDropdown({
  keywords,
  selectedKeywords,
  onChange,
  onCreateKeyword,
  placeholder = "Add keywords..."
}: SearchableKeywordDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredKeywords = searchTerm.length >= 3 ? (Array.isArray(keywords) ? keywords : []).filter(keyword =>
    keyword.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedKeywords.includes(keyword.name)
  ) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 3 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [searchTerm]);

  const handleSelect = (keywordName: string) => {
    onChange([...selectedKeywords, keywordName]);
    setSearchTerm('');
  };

  const handleRemove = (keywordName: string) => {
    onChange(selectedKeywords.filter(k => k !== keywordName));
  };

  const handleCreateNew = async () => {
    if (onCreateKeyword && searchTerm.trim()) {
      try {
        await onCreateKeyword(searchTerm.trim());
        onChange([...selectedKeywords, searchTerm.trim().toLowerCase()]);
        setSearchTerm('');
      } catch (error) {
        // Error already handled in parent component
        console.error('Failed to create keyword:', error);
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {keyword}
                <button
                  onClick={() => handleRemove(keyword)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {searchTerm.length >= 3 && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
            maxWidth: 400
          }}
        >
          <div className="max-h-48 overflow-y-auto">
            {onCreateKeyword && (
              <div
                onClick={handleCreateNew}
                className="px-4 py-2 hover:bg-green-50 cursor-pointer transition-colors border-b border-slate-200 bg-green-50/50"
              >
                <div className="font-medium text-green-700 flex items-center gap-2">
                  <span className="text-lg">+</span> Create "{searchTerm}"
                </div>
                <div className="text-xs text-green-600">Add as new keyword</div>
              </div>
            )}
            {filteredKeywords.length > 0 ? (
              filteredKeywords.map((keyword) => (
                <div
                  key={keyword._id}
                  onClick={() => handleSelect(keyword.name)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50"
                >
                  <div className="font-medium text-gray-900">{keyword.name}</div>
                </div>
              ))
            ) : !onCreateKeyword ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No keywords found matching "{searchTerm}"
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
